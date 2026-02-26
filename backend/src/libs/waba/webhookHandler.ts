import { Op } from "sequelize"

import WhatsApp from "../../models/WhatsApp"
import Contact from "../../models/Contact"
import Ticket from "../../models/Ticket"
import Message from "../../models/Message"
import TicketLog from "../../models/TicketLog"
import { emitToTenant, emitToTicket } from "../socket"
import { downloadAndSaveMedia } from "./mediaHandler"
import logger from "../../helpers/logger"
import {
  WabaWebhookBody,
  WabaValue,
  WabaIncomingMessage,
  WabaStatus,
  WabaContact,
  ACK_MAP
} from "./types"

export function verifyWebhook(
  mode: string | undefined,
  token: string | undefined,
  challenge: string | undefined
): string | null {
  const verifyToken = process.env.META_VERIFY_TOKEN

  if (mode === "subscribe" && token === verifyToken) {
    return challenge || null
  }

  return null
}

export async function processWebhook(body: WabaWebhookBody): Promise<void> {
  if (body.object !== "whatsapp_business_account") {
    return
  }

  for (const entry of body.entry) {
    for (const change of entry.changes) {
      if (change.field !== "messages") {
        continue
      }

      const { value } = change

      if (value.messages && value.messages.length > 0) {
        await handleIncomingMessages(value)
      }

      if (value.statuses && value.statuses.length > 0) {
        await handleStatusUpdates(value)
      }
    }
  }
}

async function handleIncomingMessages(value: WabaValue): Promise<void> {
  const { metadata, contacts, messages } = value

  if (!messages || !contacts) return

  const whatsapp = await WhatsApp.findOne({
    where: { wabaPhoneNumberId: metadata.phone_number_id }
  })

  if (!whatsapp) {
    logger.warn("No WhatsApp connection found for phone_number_id: %s", metadata.phone_number_id)
    return
  }

  for (const msg of messages) {
    try {
      const waContact = contacts.find(c => c.wa_id === msg.from)
      await processMessage(whatsapp, msg, waContact)
    } catch (error) {
      logger.error("Error processing incoming message %s: %o", msg.id, error)
    }
  }
}

async function processMessage(
  whatsapp: WhatsApp,
  msg: WabaIncomingMessage,
  waContact?: WabaContact
): Promise<void> {
  const tenantId = whatsapp.tenantId

  const contact = await findOrCreateContact(
    tenantId,
    msg.from,
    waContact?.profile?.name || msg.from
  )

  const ticket = await findOrCreateTicket(tenantId, contact, whatsapp)

  const { body, mediaUrl, mediaType } = await extractMessageContent(
    msg,
    whatsapp.wabaToken || "",
    tenantId
  )

  const existingMessage = await Message.findOne({
    where: { remoteJid: msg.id }
  })

  if (existingMessage) return

  const message = await Message.create({
    ticketId: ticket.id,
    contactId: contact.id,
    body,
    mediaUrl,
    mediaType,
    fromMe: false,
    isRead: false,
    remoteJid: msg.id,
    timestamp: Number(msg.timestamp),
    dataJson: msg,
    ack: 0
  })

  await ticket.update({
    lastMessage: body.substring(0, 255) || `[${msg.type}]`,
    lastMessageAt: new Date(),
    unreadMessages: ticket.unreadMessages + 1,
    status: ticket.status === "closed" ? "pending" : ticket.status
  })

  const createdMessage = await Message.findByPk(message.id, {
    include: [
      { model: Contact, as: "contact", attributes: ["id", "name", "number", "profilePicUrl"] }
    ]
  })

  emitToTicket(ticket.id, "message:created", createdMessage)
  emitToTenant(tenantId, "ticket:updated", await Ticket.findByPk(ticket.id, {
    include: [
      { model: Contact, as: "contact", attributes: ["id", "name", "number", "profilePicUrl"] }
    ]
  }))
}

async function findOrCreateContact(
  tenantId: number,
  number: string,
  name: string
): Promise<Contact> {
  const existing = await Contact.findOne({
    where: { number, tenantId }
  })

  if (existing) {
    if (name && name !== number && existing.name !== name) {
      await existing.update({ name })
    }
    return existing
  }

  const contact = await Contact.create({
    tenantId,
    name,
    number,
    isGroup: false,
    customFields: {}
  })

  emitToTenant(tenantId, "contact:created", contact)

  return contact
}

async function findOrCreateTicket(
  tenantId: number,
  contact: Contact,
  whatsapp: WhatsApp
): Promise<Ticket> {
  const openTicket = await Ticket.findOne({
    where: {
      contactId: contact.id,
      tenantId,
      whatsappId: whatsapp.id,
      status: { [Op.in]: ["open", "pending"] }
    }
  })

  if (openTicket) return openTicket

  const protocol = Math.random().toString(36).substring(2, 10).toUpperCase()

  const ticket = await Ticket.create({
    tenantId,
    contactId: contact.id,
    whatsappId: whatsapp.id,
    status: "pending",
    channel: "whatsapp",
    protocol,
    lastMessageAt: new Date(),
    unreadMessages: 0
  })

  await TicketLog.create({
    ticketId: ticket.id,
    type: "created",
    payload: { source: "webhook", whatsappId: whatsapp.id }
  })

  emitToTenant(tenantId, "ticket:created", await Ticket.findByPk(ticket.id, {
    include: [
      { model: Contact, as: "contact", attributes: ["id", "name", "number", "profilePicUrl"] }
    ]
  }))

  return ticket
}

async function extractMessageContent(
  msg: WabaIncomingMessage,
  token: string,
  tenantId: number
): Promise<{ body: string; mediaUrl: string; mediaType: string }> {
  let body = ""
  let mediaUrl = ""
  let mediaType = ""

  switch (msg.type) {
    case "text":
      body = msg.text?.body || ""
      break

    case "image":
    case "video":
    case "audio":
    case "document":
    case "sticker": {
      const media = msg[msg.type as "image" | "video" | "audio" | "document" | "sticker"]
      if (media) {
        body = ("caption" in media ? media.caption : "") || ""
        try {
          const saved = await downloadAndSaveMedia(media.id, token, tenantId)
          mediaUrl = saved.localPath
          mediaType = saved.mediaType
        } catch (error) {
          logger.error("Failed to download media %s: %o", media.id, error)
          mediaType = msg.type
        }
      }
      break
    }

    case "location":
      body = msg.location
        ? `[Location] ${msg.location.name || ""} ${msg.location.address || ""} (${msg.location.latitude}, ${msg.location.longitude})`
        : "[Location]"
      break

    case "contacts":
      body = msg.contacts
        ? `[Contact] ${msg.contacts.map(c => c.name.formatted_name).join(", ")}`
        : "[Contact]"
      break

    case "interactive":
      body = msg.interactive?.button_reply?.title
        || msg.interactive?.list_reply?.title
        || "[Interactive]"
      break

    case "button":
      body = msg.button?.text || "[Button]"
      break

    default:
      body = `[${msg.type}]`
  }

  return { body, mediaUrl, mediaType }
}

async function handleStatusUpdates(value: WabaValue): Promise<void> {
  const { statuses } = value

  if (!statuses) return

  for (const status of statuses) {
    try {
      await processStatusUpdate(status)
    } catch (error) {
      logger.error("Error processing status update %s: %o", status.id, error)
    }
  }
}

async function processStatusUpdate(status: WabaStatus): Promise<void> {
  const ack = ACK_MAP[status.status]

  if (ack === undefined) return

  const message = await Message.findOne({
    where: { remoteJid: status.id }
  })

  if (!message) return

  if (message.ack >= ack && ack > 0) return

  await message.update({
    ack,
    status: status.status
  })

  const ticket = await Ticket.findByPk(message.ticketId)

  if (ticket) {
    emitToTicket(ticket.id, "message:updated", message)
  }
}

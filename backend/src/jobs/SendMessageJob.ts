import { Job } from "bull"

import Message from "../models/Message"
import Ticket from "../models/Ticket"
import Contact from "../models/Contact"
import WhatsApp from "../models/WhatsApp"
import { sendTextMessage, sendMediaMessage } from "../libs/waba/wabaClient"
import { emitToTicket } from "../libs/socket"
import logger from "../helpers/logger"

export const QUEUE_NAME = "send-message"

export interface SendMessageData {
  messageId: number
  ticketId: number
  tenantId: number
}

export async function process(job: Job<SendMessageData>): Promise<void> {
  const { messageId, ticketId, tenantId: _tenantId } = job.data

  const message = await Message.findByPk(messageId)
  if (!message) {
    logger.warn("SendMessageJob: Message %d not found", messageId)
    return
  }

  const ticket = await Ticket.findByPk(ticketId)
  if (!ticket || !ticket.whatsappId) {
    logger.warn("SendMessageJob: Ticket %d not found or no WhatsApp", ticketId)
    return
  }

  const whatsapp = await WhatsApp.findByPk(ticket.whatsappId)
  if (!whatsapp || whatsapp.status !== "connected" || !whatsapp.wabaPhoneNumberId || !whatsapp.wabaToken) {
    logger.warn("SendMessageJob: WhatsApp %d not available", ticket.whatsappId)
    return
  }

  const contact = await Contact.findByPk(ticket.contactId)
  if (!contact || !contact.number) {
    logger.warn("SendMessageJob: Contact %d not found", ticket.contactId)
    return
  }

  let response

  if (message.mediaUrl && message.mediaType) {
    const mediaTypeMap: Record<string, "image" | "video" | "audio" | "document"> = {
      image: "image",
      video: "video",
      audio: "audio",
      document: "document"
    }

    const type = mediaTypeMap[message.mediaType] || "document"
    const backendUrl = process.env.BACKEND_URL || "http://localhost:7563"
    const fullMediaUrl = `${backendUrl}/public/${message.mediaUrl}`

    response = await sendMediaMessage(
      whatsapp.wabaPhoneNumberId,
      whatsapp.wabaToken,
      contact.number,
      type,
      fullMediaUrl,
      message.body || undefined
    )
  } else {
    response = await sendTextMessage(
      whatsapp.wabaPhoneNumberId,
      whatsapp.wabaToken,
      contact.number,
      message.body
    )
  }

  if (response?.messages?.[0]?.id) {
    await message.update({
      remoteJid: response.messages[0].id,
      status: "sent",
      ack: 1
    })

    emitToTicket(ticketId, "message:updated", message)
  }

  logger.info("SendMessageJob: Message %d sent to %s", messageId, contact.number)
}

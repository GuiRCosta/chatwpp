import Message from "../models/Message"
import Ticket from "../models/Ticket"
import Contact from "../models/Contact"
import { AppError } from "../helpers/AppError"
import { emitToTicket, emitToTenant } from "../libs/socket"
import { getQueue } from "../libs/queues"
import { QUEUE_NAME as SEND_MESSAGE_QUEUE } from "../jobs/SendMessageJob"
import logger from "../helpers/logger"

interface ListParams {
  ticketId: number
  tenantId: number
  pageNumber?: string | number
  limit?: string | number
}

interface ListResult {
  messages: Message[]
  count: number
  hasMore: boolean
}

export const listMessages = async ({ ticketId, tenantId, pageNumber = "1", limit = "20" }: ListParams): Promise<ListResult> => {
  const ticket = await Ticket.findOne({
    where: { id: ticketId, tenantId }
  })

  if (!ticket) {
    throw new AppError("Ticket not found", 404)
  }

  const offset = (Number(pageNumber) - 1) * Number(limit)

  const { rows: messages, count } = await Message.findAndCountAll({
    where: { ticketId },
    include: [
      { model: Contact, as: "contact", attributes: ["id", "name", "number", "profilePicUrl"] }
    ],
    limit: Number(limit),
    offset,
    order: [["timestamp", "DESC"]]
  })

  const hasMore = count > offset + messages.length

  return { messages: messages.reverse(), count, hasMore }
}

export const createMessage = async (ticketId: number, tenantId: number, data: {
  body: string
  contactId?: number
  mediaUrl?: string
  mediaType?: string
  fromMe?: boolean
  quotedMsgId?: string
}): Promise<Message> => {
  const ticket = await Ticket.findOne({
    where: { id: ticketId, tenantId }
  })

  if (!ticket) {
    throw new AppError("Ticket not found", 404)
  }

  const message = await Message.create({
    ticketId,
    contactId: data.contactId || ticket.contactId,
    body: data.body,
    mediaUrl: data.mediaUrl || "",
    mediaType: data.mediaType || "",
    fromMe: data.fromMe !== undefined ? data.fromMe : true,
    quotedMsgId: data.quotedMsgId || "",
    timestamp: Math.floor(Date.now() / 1000),
    status: "sent",
    ack: 1
  })

  await ticket.update({
    lastMessage: data.body.substring(0, 255),
    lastMessageAt: new Date(),
    unreadMessages: data.fromMe ? ticket.unreadMessages : ticket.unreadMessages + 1
  })

  const createdMessage = await Message.findByPk(message.id, {
    include: [
      { model: Contact, as: "contact", attributes: ["id", "name", "number", "profilePicUrl"] }
    ]
  })

  emitToTicket(ticketId, "message:created", createdMessage)
  emitToTenant(tenantId, "ticket:updated", await Ticket.findByPk(ticketId, {
    include: [
      { model: Contact, as: "contact", attributes: ["id", "name", "number", "profilePicUrl"] }
    ]
  }))

  if (data.fromMe !== false) {
    try {
      const queue = getQueue(SEND_MESSAGE_QUEUE)
      await queue.add({
        messageId: message.id,
        ticketId,
        tenantId
      })
    } catch (error) {
      logger.error("Failed to enqueue message for WhatsApp: %o", error)
    }
  }

  return createdMessage!
}

export const markMessagesAsRead = async (ticketId: number, tenantId: number): Promise<void> => {
  const ticket = await Ticket.findOne({
    where: { id: ticketId, tenantId }
  })

  if (!ticket) {
    throw new AppError("Ticket not found", 404)
  }

  await Message.update(
    { isRead: true },
    { where: { ticketId, isRead: false } }
  )

  await ticket.update({ unreadMessages: 0 })

  emitToTenant(tenantId, "ticket:updated", ticket)
}

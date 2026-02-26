import { Op } from "sequelize"
import { v4 as uuidv4 } from "uuid"

import Ticket from "../models/Ticket"
import Contact from "../models/Contact"
import User from "../models/User"
import Queue from "../models/Queue"
import WhatsApp from "../models/WhatsApp"
import Message from "../models/Message"
import TicketLog from "../models/TicketLog"
import TicketNote from "../models/TicketNote"
import { AppError } from "../helpers/AppError"
import { emitToTenant } from "../libs/socket"

interface ListParams {
  tenantId: number
  searchParam?: string
  pageNumber?: string | number
  limit?: string | number
  status?: string
  userId?: number
  queueIds?: number[]
  showAll?: boolean
}

interface ListResult {
  tickets: Ticket[]
  count: number
  hasMore: boolean
}

export const listTickets = async ({
  tenantId,
  searchParam = "",
  pageNumber = "1",
  limit = "40",
  status,
  userId,
  queueIds,
  showAll = false
}: ListParams): Promise<ListResult> => {
  const offset = (Number(pageNumber) - 1) * Number(limit)

  const where: Record<string, unknown> = { tenantId }

  if (status) {
    where.status = status
  }

  if (!showAll && userId) {
    where.userId = userId
  }

  if (queueIds && queueIds.length > 0) {
    where.queueId = { [Op.in]: queueIds }
  }

  const includeConditions: Array<Record<string, unknown>> = [
    {
      model: Contact,
      as: "contact",
      attributes: ["id", "name", "number", "profilePicUrl"]
    },
    {
      model: User,
      as: "user",
      attributes: ["id", "name"]
    },
    {
      model: Queue,
      as: "queue",
      attributes: ["id", "name", "color"]
    },
    {
      model: WhatsApp,
      as: "whatsapp",
      attributes: ["id", "name"]
    }
  ]

  if (searchParam) {
    includeConditions[0] = {
      ...includeConditions[0],
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${searchParam}%` } },
          { number: { [Op.iLike]: `%${searchParam}%` } }
        ]
      },
      required: true
    }
  }

  const { rows: tickets, count } = await Ticket.findAndCountAll({
    where,
    include: includeConditions,
    limit: Number(limit),
    offset,
    order: [["lastMessageAt", "DESC"]],
    distinct: true
  })

  const hasMore = count > offset + tickets.length

  return { tickets, count, hasMore }
}

export const findTicketById = async (id: number, tenantId: number): Promise<Ticket> => {
  const ticket = await Ticket.findOne({
    where: { id, tenantId },
    include: [
      { model: Contact, as: "contact" },
      { model: User, as: "user", attributes: ["id", "name", "email"] },
      { model: Queue, as: "queue" },
      { model: WhatsApp, as: "whatsapp", attributes: ["id", "name", "number"] }
    ]
  })

  if (!ticket) {
    throw new AppError("Ticket not found", 404)
  }

  return ticket
}

export const createTicket = async (tenantId: number, userId: number, data: {
  contactId: number
  queueId?: number
  whatsappId?: number
  status?: string
  channel?: string
}): Promise<Ticket> => {
  const openTicket = await Ticket.findOne({
    where: {
      contactId: data.contactId,
      tenantId,
      status: { [Op.in]: ["open", "pending"] }
    }
  })

  if (openTicket) {
    throw new AppError("An open ticket already exists for this contact", 409)
  }

  const protocol = uuidv4().substring(0, 8).toUpperCase()

  const ticket = await Ticket.create({
    tenantId,
    contactId: data.contactId,
    userId,
    queueId: data.queueId || null,
    whatsappId: data.whatsappId || null,
    status: data.status || "pending",
    channel: data.channel || "whatsapp",
    protocol,
    lastMessageAt: new Date()
  })

  await TicketLog.create({
    ticketId: ticket.id,
    type: "created",
    payload: { userId, status: ticket.status }
  })

  const createdTicket = await findTicketById(ticket.id, tenantId)

  emitToTenant(tenantId, "ticket:created", createdTicket)

  return createdTicket
}

export const updateTicket = async (id: number, tenantId: number, userId: number, data: {
  userId?: number
  queueId?: number
  status?: string
  isFarewellMessage?: boolean
}): Promise<Ticket> => {
  const ticket = await Ticket.findOne({ where: { id, tenantId } })

  if (!ticket) {
    throw new AppError("Ticket not found", 404)
  }

  const oldStatus = ticket.status
  const oldUserId = ticket.userId

  await ticket.update(data)

  if (data.status && data.status !== oldStatus) {
    await TicketLog.create({
      ticketId: id,
      type: "status_changed",
      payload: { userId, from: oldStatus, to: data.status }
    })
  }

  if (data.userId && data.userId !== oldUserId) {
    await TicketLog.create({
      ticketId: id,
      type: "transferred",
      payload: { userId, from: oldUserId, to: data.userId }
    })
  }

  const updatedTicket = await findTicketById(id, tenantId)

  emitToTenant(tenantId, "ticket:updated", updatedTicket)

  return updatedTicket
}

export const deleteTicket = async (id: number, tenantId: number): Promise<void> => {
  const ticket = await Ticket.findOne({ where: { id, tenantId } })

  if (!ticket) {
    throw new AppError("Ticket not found", 404)
  }

  await Message.destroy({ where: { ticketId: id } })
  await TicketLog.destroy({ where: { ticketId: id } })
  await TicketNote.destroy({ where: { ticketId: id } })
  await ticket.destroy()

  emitToTenant(tenantId, "ticket:deleted", { id })
}

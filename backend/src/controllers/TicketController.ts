import { Request, Response } from "express"

import * as TicketService from "../services/TicketService"
import { createTicketSchema, updateTicketSchema } from "../validators/TicketValidator"

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, userId, userProfile } = req
  const { searchParam, pageNumber, limit, status, queueIds, showAll } = req.query

  const parsedQueueIds = queueIds
    ? String(queueIds).split(",").map(Number).filter(Boolean)
    : undefined

  const isAdmin = ["admin", "superadmin"].includes(userProfile)

  const { tickets, count, hasMore } = await TicketService.listTickets({
    tenantId,
    searchParam: String(searchParam || ""),
    pageNumber: String(pageNumber || "1"),
    limit: String(limit || "40"),
    status: status ? String(status) : undefined,
    userId,
    queueIds: parsedQueueIds,
    showAll: showAll === "true" || isAdmin
  })

  return res.json({
    success: true,
    data: tickets,
    meta: {
      total: count,
      page: Number(pageNumber || 1),
      limit: Number(limit || 40),
      hasMore
    }
  })
}

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const ticket = await TicketService.findTicketById(Number(id), tenantId)

  return res.json({
    success: true,
    data: ticket
  })
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, userId } = req

  const validated = await createTicketSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const ticket = await TicketService.createTicket(tenantId, userId, validated)

  return res.status(201).json({
    success: true,
    data: ticket
  })
}

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, userId } = req
  const { id } = req.params

  const validated = await updateTicketSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const ticket = await TicketService.updateTicket(Number(id), tenantId, userId, validated)

  return res.json({
    success: true,
    data: ticket
  })
}

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  await TicketService.deleteTicket(Number(id), tenantId)

  return res.json({
    success: true,
    data: { message: "Ticket deleted successfully" }
  })
}

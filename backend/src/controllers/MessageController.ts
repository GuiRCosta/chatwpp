import { Request, Response } from "express"

import * as MessageService from "../services/MessageService"
import { createMessageSchema } from "../validators/MessageValidator"

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { ticketId } = req.params
  const { pageNumber, limit } = req.query

  const { messages, count, hasMore } = await MessageService.listMessages({
    ticketId: Number(ticketId),
    tenantId,
    pageNumber: String(pageNumber || "1"),
    limit: String(limit || "20")
  })

  return res.json({
    success: true,
    data: messages,
    meta: {
      total: count,
      page: Number(pageNumber || 1),
      limit: Number(limit || 20),
      hasMore
    }
  })
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { ticketId } = req.params

  const validated = await createMessageSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const message = await MessageService.createMessage(
    Number(ticketId),
    tenantId,
    validated
  )

  return res.status(201).json({
    success: true,
    data: message
  })
}

export const markAsRead = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { ticketId } = req.params

  await MessageService.markMessagesAsRead(Number(ticketId), tenantId)

  return res.json({
    success: true,
    data: { message: "Messages marked as read" }
  })
}

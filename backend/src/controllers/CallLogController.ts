import { Request, Response } from "express"

import * as CallLogService from "../services/CallLogService"
import { createCallLogSchema } from "../validators/CallLogValidator"

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { type, contactId } = req.query

  const callLogs = await CallLogService.listCallLogs({
    tenantId,
    type: type ? String(type) : undefined,
    contactId: contactId ? Number(contactId) : undefined
  })

  return res.json({
    success: true,
    data: callLogs
  })
}

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const callLog = await CallLogService.findCallLogById(Number(id), tenantId)

  return res.json({
    success: true,
    data: callLog
  })
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, userId } = req

  const validated = await createCallLogSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const callLog = await CallLogService.createCallLog(tenantId, userId, validated)

  return res.status(201).json({
    success: true,
    data: callLog
  })
}

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  await CallLogService.deleteCallLog(Number(id), tenantId)

  return res.json({
    success: true,
    data: { message: "CallLog deleted successfully" }
  })
}

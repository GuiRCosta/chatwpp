import { Request, Response } from "express"

import * as FastReplyService from "../services/FastReplyService"
import { createFastReplySchema, updateFastReplySchema } from "../validators/FastReplyValidator"

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, userId } = req
  const { searchParam } = req.query

  const fastReplies = await FastReplyService.listFastReplies({
    tenantId,
    userId,
    searchParam: String(searchParam || "")
  })

  return res.json({
    success: true,
    data: fastReplies
  })
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, userId } = req

  const validated = await createFastReplySchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const fastReply = await FastReplyService.createFastReply(tenantId, userId, validated)

  return res.status(201).json({
    success: true,
    data: fastReply
  })
}

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, userId } = req
  const { id } = req.params

  const validated = await updateFastReplySchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const fastReply = await FastReplyService.updateFastReply(Number(id), tenantId, userId, validated)

  return res.json({
    success: true,
    data: fastReply
  })
}

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, userId } = req
  const { id } = req.params

  await FastReplyService.deleteFastReply(Number(id), tenantId, userId)

  return res.json({
    success: true,
    data: { message: "Fast reply deleted successfully" }
  })
}

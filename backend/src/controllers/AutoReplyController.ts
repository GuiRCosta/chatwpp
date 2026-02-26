import { Request, Response } from "express"

import * as AutoReplyService from "../services/AutoReplyService"
import {
  createAutoReplySchema,
  updateAutoReplySchema,
  createStepSchema,
  updateStepSchema
} from "../validators/AutoReplyValidator"

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { searchParam, isActive } = req.query

  const autoReplies = await AutoReplyService.listAutoReplies({
    tenantId,
    searchParam: String(searchParam || ""),
    isActive: isActive !== undefined ? isActive === "true" : undefined
  })

  return res.json({
    success: true,
    data: autoReplies
  })
}

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const autoReply = await AutoReplyService.findAutoReplyById(Number(id), tenantId)

  return res.json({
    success: true,
    data: autoReply
  })
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, userId } = req

  const validated = await createAutoReplySchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const autoReply = await AutoReplyService.createAutoReply(tenantId, userId, validated)

  return res.status(201).json({
    success: true,
    data: autoReply
  })
}

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const validated = await updateAutoReplySchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const autoReply = await AutoReplyService.updateAutoReply(Number(id), tenantId, validated)

  return res.json({
    success: true,
    data: autoReply
  })
}

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  await AutoReplyService.deleteAutoReply(Number(id), tenantId)

  return res.json({
    success: true,
    data: { message: "Auto reply deleted successfully" }
  })
}

export const createStep = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const validated = await createStepSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const step = await AutoReplyService.createStep(Number(id), tenantId, validated)

  return res.status(201).json({
    success: true,
    data: step
  })
}

export const updateStep = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id, stepId } = req.params

  const validated = await updateStepSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const step = await AutoReplyService.updateStep(Number(id), Number(stepId), tenantId, validated)

  return res.json({
    success: true,
    data: step
  })
}

export const removeStep = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id, stepId } = req.params

  await AutoReplyService.deleteStep(Number(id), Number(stepId), tenantId)

  return res.json({
    success: true,
    data: { message: "Step deleted successfully" }
  })
}

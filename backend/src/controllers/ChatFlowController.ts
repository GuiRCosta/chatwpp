import { Request, Response } from "express"

import * as ChatFlowService from "../services/ChatFlowService"
import { createChatFlowSchema, updateChatFlowSchema } from "../validators/ChatFlowValidator"

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { searchParam, isActive } = req.query

  const parsedIsActive = isActive === "true" ? true : isActive === "false" ? false : undefined

  const chatFlows = await ChatFlowService.listChatFlows({
    tenantId,
    searchParam: String(searchParam || ""),
    isActive: parsedIsActive
  })

  return res.json({
    success: true,
    data: chatFlows
  })
}

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const chatFlow = await ChatFlowService.findChatFlowById(Number(id), tenantId)

  return res.json({
    success: true,
    data: chatFlow
  })
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req

  const validated = await createChatFlowSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const chatFlow = await ChatFlowService.createChatFlow(tenantId, validated)

  return res.status(201).json({
    success: true,
    data: chatFlow
  })
}

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const validated = await updateChatFlowSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const chatFlow = await ChatFlowService.updateChatFlow(Number(id), tenantId, validated)

  return res.json({
    success: true,
    data: chatFlow
  })
}

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  await ChatFlowService.deleteChatFlow(Number(id), tenantId)

  return res.json({
    success: true,
    data: { message: "ChatFlow deleted successfully" }
  })
}

export const duplicate = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const chatFlow = await ChatFlowService.duplicateChatFlow(Number(id), tenantId)

  return res.status(201).json({
    success: true,
    data: chatFlow
  })
}

import { Request, Response } from "express"

import * as WebhookConfigService from "../services/WebhookConfigService"
import {
  createWebhookSchema,
  updateWebhookSchema
} from "../validators/WebhookConfigValidator"

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req

  const webhooks = await WebhookConfigService.listWebhooks(tenantId)

  return res.json({
    success: true,
    data: webhooks
  })
}

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const webhook = await WebhookConfigService.findWebhookById(Number(id), tenantId)

  return res.json({
    success: true,
    data: webhook
  })
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req

  const validated = await createWebhookSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const webhook = await WebhookConfigService.createWebhook(tenantId, validated)

  return res.status(201).json({
    success: true,
    data: webhook
  })
}

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const validated = await updateWebhookSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const webhook = await WebhookConfigService.updateWebhook(
    Number(id),
    tenantId,
    validated
  )

  return res.json({
    success: true,
    data: webhook
  })
}

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  await WebhookConfigService.deleteWebhook(Number(id), tenantId)

  return res.json({
    success: true,
    data: { message: "Webhook deleted successfully" }
  })
}

export const supportedEvents = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  return res.json({
    success: true,
    data: WebhookConfigService.SUPPORTED_EVENTS
  })
}

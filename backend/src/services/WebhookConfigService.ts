import TenantWebhook from "../models/TenantWebhook"
import { AppError } from "../helpers/AppError"
import { invalidateCache } from "../libs/webhookDispatcher"

export const SUPPORTED_EVENTS = [
  "message_created",
  "conversation_created",
  "conversation_status_changed",
  "contact_created"
] as const

export const listWebhooks = async (tenantId: number): Promise<TenantWebhook[]> => {
  return TenantWebhook.findAll({
    where: { tenantId },
    order: [["createdAt", "DESC"]]
  })
}

export const findWebhookById = async (
  id: number,
  tenantId: number
): Promise<TenantWebhook> => {
  const webhook = await TenantWebhook.findOne({
    where: { id, tenantId }
  })

  if (!webhook) {
    throw new AppError("Webhook not found", 404)
  }

  return webhook
}

export const createWebhook = async (
  tenantId: number,
  data: {
    url: string
    events: string[]
    secret?: string
    isActive?: boolean
  }
): Promise<TenantWebhook> => {
  const webhook = await TenantWebhook.create({
    tenantId,
    url: data.url,
    events: data.events,
    secret: data.secret || null,
    isActive: data.isActive !== false
  })

  invalidateCache(tenantId)

  return webhook
}

export const updateWebhook = async (
  id: number,
  tenantId: number,
  data: {
    url?: string
    events?: string[]
    secret?: string
    isActive?: boolean
  }
): Promise<TenantWebhook> => {
  const webhook = await TenantWebhook.findOne({
    where: { id, tenantId }
  })

  if (!webhook) {
    throw new AppError("Webhook not found", 404)
  }

  await webhook.update(data)

  invalidateCache(tenantId)

  return webhook
}

export const deleteWebhook = async (
  id: number,
  tenantId: number
): Promise<void> => {
  const webhook = await TenantWebhook.findOne({
    where: { id, tenantId }
  })

  if (!webhook) {
    throw new AppError("Webhook not found", 404)
  }

  await webhook.destroy()

  invalidateCache(tenantId)
}

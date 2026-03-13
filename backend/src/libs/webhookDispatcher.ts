import TenantWebhook from "../models/TenantWebhook"
import { getQueue } from "./queues"
import { QUEUE_NAME as WEBHOOK_QUEUE } from "../jobs/WebhookDispatchJob"
import { QUEUE_NAME as AUTOMATION_QUEUE } from "../jobs/AutomationJob"
import { logger } from "../helpers/logger"

interface CacheEntry {
  webhooks: TenantWebhook[]
  expiresAt: number
}

const CACHE_TTL_MS = 60_000
const cache = new Map<number, CacheEntry>()

async function getWebhooksForTenant(tenantId: number): Promise<TenantWebhook[]> {
  const cached = cache.get(tenantId)

  if (cached && cached.expiresAt > Date.now()) {
    return cached.webhooks
  }

  const webhooks = await TenantWebhook.findAll({
    where: { tenantId, isActive: true }
  })

  cache.set(tenantId, {
    webhooks,
    expiresAt: Date.now() + CACHE_TTL_MS
  })

  return webhooks
}

export function invalidateCache(tenantId: number): void {
  cache.delete(tenantId)
}

export async function dispatchEvent(
  tenantId: number,
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  try {
    const webhooks = await getWebhooksForTenant(tenantId)

    const matching = webhooks.filter(
      (wh) => wh.events.includes(event) || wh.events.includes("*")
    )

    if (matching.length === 0) return

    const queue = getQueue(WEBHOOK_QUEUE)

    const enqueuePromises = matching.map((wh) =>
      queue.add({
        url: wh.url,
        secret: wh.secret,
        event,
        payload: { ...data, tenantId }
      })
    )

    await Promise.all(enqueuePromises)

    logger.debug(
      "webhookDispatcher: Event %s enqueued for %d webhook(s) (tenant %d)",
      event,
      matching.length,
      tenantId
    )
  } catch (error) {
    logger.error("webhookDispatcher: Failed to dispatch event %s: %o", event, error)
  }

  enqueueAutomation(tenantId, event, data)
}

const AUTOMATION_EVENTS = ["message_created", "conversation_created", "conversation_status_changed"]

function enqueueAutomation(
  tenantId: number,
  event: string,
  data: Record<string, unknown>
): void {
  if (!AUTOMATION_EVENTS.includes(event)) return

  const ticketId = Number(data.ticketId || data.id)
  if (!ticketId) return

  try {
    const queue = getQueue(AUTOMATION_QUEUE)
    const eventName = event === "conversation_status_changed" ? "conversation_updated" : event

    queue.add({
      tenantId,
      eventName,
      ticketId,
      messageId: event === "message_created" ? Number(data.id) : undefined
    })
  } catch (error) {
    logger.error("webhookDispatcher: Failed to enqueue automation for event %s: %o", event, error)
  }
}

import { Job } from "bull"
import crypto from "crypto"

import { logger } from "../helpers/logger"

export const QUEUE_NAME = "webhook-dispatch"

export interface WebhookDispatchData {
  url: string
  secret: string | null
  event: string
  payload: Record<string, unknown>
}

export async function process(job: Job<WebhookDispatchData>): Promise<void> {
  const { url, secret, event, payload } = job.data

  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data: payload
  })

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-ZFlow-Event": event,
    "User-Agent": "ZFlow-Webhook/1.0"
  }

  if (secret) {
    const signature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex")
    headers["X-ZFlow-Signature"] = signature
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body,
    signal: AbortSignal.timeout(10000)
  })

  if (!response.ok) {
    throw new Error(
      `Webhook ${url} returned ${response.status}: ${response.statusText}`
    )
  }

  logger.debug(
    "WebhookDispatchJob: Event %s dispatched to %s (status %d)",
    event,
    url,
    response.status
  )
}

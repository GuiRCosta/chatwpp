import { Job } from "bull"

import { logger } from "../helpers/logger"

export const QUEUE_NAME = "dead-letter"

export interface DeadLetterData {
  messageId: number
  ticketId: number
  tenantId: number
  whatsappId: number
  originalQueue: string
  failureReason: string
  failedAt: string
  attemptsMade: number
}

export async function process(job: Job<DeadLetterData>): Promise<void> {
  logger.info(
    "DeadLetterJob: Stored failed message %d (tenant: %d, whatsapp: %d, reason: %s)",
    job.data.messageId,
    job.data.tenantId,
    job.data.whatsappId,
    job.data.failureReason
  )
}

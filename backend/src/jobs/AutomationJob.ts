import { Job } from "bull"

import { processAutomation } from "../services/AutomationEngine"
import { logger } from "../helpers/logger"

export const QUEUE_NAME = "automation-engine"

export interface AutomationJobData {
  tenantId: number
  eventName: string
  ticketId: number
  messageId?: number
}

// eslint-disable-next-line @typescript-eslint/no-shadow
export async function process(job: Job<AutomationJobData>): Promise<void> {
  const { tenantId, eventName, ticketId } = job.data

  logger.debug(
    "AutomationJob: Processing event=%s for ticket=%d (tenant=%d)",
    eventName,
    ticketId,
    tenantId
  )

  await processAutomation(job.data)
}

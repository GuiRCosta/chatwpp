import cron from "node-cron"

import Campaign from "../models/Campaign"
import { getQueue } from "../libs/queues"
import { QUEUE_NAME as CAMPAIGN_QUEUE } from "./CampaignJob"
import { QUEUE_NAME as CLEANUP_QUEUE } from "./CleanupTicketsJob"
import { checkWhatsAppConnections } from "../services/WhatsAppHealthService"
import { checkTokenExpirations } from "../services/TokenExpirationService"
import { logger } from "../helpers/logger"

const scheduledTasks: cron.ScheduledTask[] = []

export function initScheduledJobs(): void {
  const campaignCheck = cron.schedule("*/1 * * * *", async () => {
    try {
      await enqueueScheduledCampaigns()
    } catch (error) {
      logger.error("ScheduledJobs: Campaign check failed: %o", error)
    }
  })

  scheduledTasks.push(campaignCheck)

  const ticketCleanup = cron.schedule("*/30 * * * *", async () => {
    try {
      await enqueueTicketCleanup()
    } catch (error) {
      logger.error("ScheduledJobs: Ticket cleanup failed: %o", error)
    }
  })

  scheduledTasks.push(ticketCleanup)

  const whatsappHealthCheck = cron.schedule("*/5 * * * *", async () => {
    try {
      await checkWhatsAppConnections()
    } catch (error) {
      logger.error("ScheduledJobs: WhatsApp health check failed: %o", error)
    }
  })

  scheduledTasks.push(whatsappHealthCheck)

  const tokenExpirationCheck = cron.schedule("0 8 * * *", async () => {
    try {
      await checkTokenExpirations()
    } catch (error) {
      logger.error("ScheduledJobs: Token expiration check failed: %o", error)
    }
  })

  scheduledTasks.push(tokenExpirationCheck)

  logger.info(
    "Scheduled jobs initialized: campaign check (1min), ticket cleanup (30min), whatsapp health (5min), token expiration (daily 8am)"
  )
}

export function stopScheduledJobs(): void {
  for (const task of scheduledTasks) {
    task.stop()
  }
  scheduledTasks.length = 0
  logger.info("All scheduled jobs stopped")
}

async function enqueueScheduledCampaigns(): Promise<void> {
  const now = new Date()

  const campaigns = await Campaign.findAll({
    where: {
      status: "scheduled",
      scheduledAt: { $lte: now } as never
    }
  })

  if (campaigns.length === 0) return

  const queue = getQueue(CAMPAIGN_QUEUE)

  for (const campaign of campaigns) {
    await campaign.update({ status: "queued" })

    await queue.add({
      campaignId: campaign.id,
      tenantId: campaign.tenantId
    })

    logger.info("ScheduledJobs: Campaign %d enqueued for processing", campaign.id)
  }
}

async function enqueueTicketCleanup(): Promise<void> {
  const queue = getQueue(CLEANUP_QUEUE)
  await queue.add({})
  logger.debug("ScheduledJobs: Ticket cleanup job enqueued")
}

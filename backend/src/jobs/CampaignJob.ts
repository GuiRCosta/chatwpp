import { Job } from "bull"

import Campaign from "../models/Campaign"
import CampaignContact from "../models/CampaignContact"
import Contact from "../models/Contact"
import WhatsApp from "../models/WhatsApp"
import { sendTextMessage, sendMediaMessage } from "../libs/waba/wabaClient"
import { emitToTenant } from "../libs/socket"
import logger from "../helpers/logger"

export const QUEUE_NAME = "campaign"

export interface CampaignData {
  campaignId: number
  tenantId: number
}

const DELAY_BETWEEN_MESSAGES_MS = 2000

export async function process(job: Job<CampaignData>): Promise<void> {
  const { campaignId, tenantId } = job.data

  const campaign = await Campaign.findByPk(campaignId)
  if (!campaign) {
    logger.warn("CampaignJob: Campaign %d not found", campaignId)
    return
  }

  if (campaign.status === "cancelled") return

  await campaign.update({ status: "processing" })
  emitToTenant(tenantId, "campaign:updated", campaign)

  const whatsapp = campaign.whatsappId
    ? await WhatsApp.findByPk(campaign.whatsappId)
    : null

  if (!whatsapp || !whatsapp.wabaPhoneNumberId || !whatsapp.wabaToken) {
    await campaign.update({ status: "cancelled" })
    logger.error("CampaignJob: No valid WhatsApp for campaign %d", campaignId)
    return
  }

  const pendingContacts = await CampaignContact.findAll({
    where: { campaignId, status: "pending" },
    include: [{ model: Contact, as: "contact" }]
  })

  for (const campaignContact of pendingContacts) {
    if (campaign.status === "cancelled") break

    const contact = (campaignContact as CampaignContact & { contact: Contact }).contact
    if (!contact || !contact.number) {
      await campaignContact.update({ status: "error" })
      continue
    }

    try {
      if (campaign.mediaUrl) {
        await sendMediaMessage(
          whatsapp.wabaPhoneNumberId,
          whatsapp.wabaToken,
          contact.number,
          "image",
          campaign.mediaUrl,
          campaign.message || undefined
        )
      } else {
        await sendTextMessage(
          whatsapp.wabaPhoneNumberId,
          whatsapp.wabaToken,
          contact.number,
          campaign.message
        )
      }

      await campaignContact.update({
        status: "sent",
        sentAt: new Date()
      })
    } catch (error) {
      await campaignContact.update({ status: "error" })
      logger.error("CampaignJob: Failed to send to contact %d: %o", contact.id, error)
    }

    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_MESSAGES_MS))
  }

  await campaign.update({
    status: "completed",
    completedAt: new Date()
  })

  emitToTenant(tenantId, "campaign:updated", campaign)

  logger.info("CampaignJob: Campaign %d completed", campaignId)
}

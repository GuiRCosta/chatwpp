import { Job } from "bull"

import Campaign from "../models/Campaign"
import CampaignContact from "../models/CampaignContact"
import Contact from "../models/Contact"
import WhatsApp from "../models/WhatsApp"
import { sendTemplateMessage } from "../libs/waba/wabaClient"
import { TemplateComponent } from "../libs/waba/types"
import { emitToTenant } from "../libs/socket"
import { logger } from "../helpers/logger"

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

  if (!campaign.templateName) {
    await campaign.update({ status: "cancelled" })
    logger.error("CampaignJob: Campaign %d has no template configured", campaignId)
    return
  }

  await campaign.update({ status: "running" })
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

  const components = (campaign.templateComponents || []) as unknown as TemplateComponent[]

  for (const campaignContact of pendingContacts) {
    const freshCampaign = await Campaign.findByPk(campaignId)
    if (freshCampaign?.status === "cancelled") break

    const contact = (campaignContact as CampaignContact & { contact: Contact }).contact
    if (!contact || !contact.number) {
      await campaignContact.update({ status: "error" })
      continue
    }

    try {
      await sendTemplateMessage(
        whatsapp.wabaPhoneNumberId,
        whatsapp.wabaToken,
        contact.number,
        campaign.templateName,
        campaign.templateLanguage || "pt_BR",
        components.length > 0 ? components : undefined
      )

      await campaignContact.update({
        status: "sent",
        sentAt: new Date()
      })
    } catch (error) {
      await campaignContact.update({ status: "error" })
      logger.error("CampaignJob: Failed to send template to contact %d: %o", contact.id, error)
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

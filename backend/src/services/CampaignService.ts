import { Op, fn, col } from "sequelize"

import Campaign from "../models/Campaign"
import CampaignContact from "../models/CampaignContact"
import Contact from "../models/Contact"
import WhatsApp from "../models/WhatsApp"
import { AppError } from "../helpers/AppError"
import { emitToTenant } from "../libs/socket"
import { getQueue } from "../libs/queues"
import { QUEUE_NAME as CAMPAIGN_QUEUE } from "../jobs/CampaignJob"

interface ListParams {
  tenantId: number
  pageNumber?: string | number
  limit?: string | number
  status?: string
}

interface ListResult {
  campaigns: Campaign[]
  count: number
  hasMore: boolean
}

export const listCampaigns = async ({
  tenantId,
  pageNumber = "1",
  limit = "20",
  status
}: ListParams): Promise<ListResult> => {
  const offset = (Number(pageNumber) - 1) * Number(limit)

  const where: Record<string, unknown> = { tenantId }

  if (status) {
    where.status = status
  }

  const { rows: campaigns, count } = await Campaign.findAndCountAll({
    where,
    include: [
      {
        model: WhatsApp,
        as: "whatsapp",
        attributes: ["id", "name"]
      }
    ],
    limit: Number(limit),
    offset,
    order: [["createdAt", "DESC"]]
  })

  const hasMore = count > offset + campaigns.length

  return { campaigns, count, hasMore }
}

export const findCampaignById = async (id: number, tenantId: number): Promise<Campaign> => {
  const campaign = await Campaign.findOne({
    where: { id, tenantId },
    include: [
      {
        model: WhatsApp,
        as: "whatsapp",
        attributes: ["id", "name"]
      }
    ]
  })

  if (!campaign) {
    throw new AppError("Campaign not found", 404)
  }

  const statusCounts = await CampaignContact.findAll({
    where: { campaignId: id },
    attributes: [
      "status",
      [fn("COUNT", col("id")), "count"]
    ],
    group: ["status"],
    raw: true
  })

  const campaignWithCounts = campaign.toJSON() as Campaign & {
    contactCounts: { pending: number; sent: number; delivered: number; read: number; error: number }
  }

  campaignWithCounts.contactCounts = {
    pending: 0,
    sent: 0,
    delivered: 0,
    read: 0,
    error: 0
  }

  statusCounts.forEach((item: { status: string; count: number }) => {
    const status = item.status as "pending" | "sent" | "delivered" | "read" | "error"
    campaignWithCounts.contactCounts[status] = Number(item.count)
  })

  return campaignWithCounts as unknown as Campaign
}

export const createCampaign = async (
  tenantId: number,
  data: {
    name: string
    message: string
    whatsappId: number
    mediaUrl?: string
    scheduledAt?: Date
  }
): Promise<Campaign> => {
  const whatsapp = await WhatsApp.findOne({
    where: { id: data.whatsappId, tenantId }
  })

  if (!whatsapp) {
    throw new AppError("WhatsApp connection not found", 404)
  }

  const campaign = await Campaign.create({
    tenantId,
    name: data.name,
    message: data.message,
    whatsappId: data.whatsappId,
    mediaUrl: data.mediaUrl || "",
    scheduledAt: data.scheduledAt || null,
    status: "pending"
  })

  const createdCampaign = await findCampaignById(campaign.id, tenantId)

  emitToTenant(tenantId, "campaign:created", createdCampaign)

  return createdCampaign
}

export const updateCampaign = async (
  id: number,
  tenantId: number,
  data: {
    name?: string
    message?: string
    whatsappId?: number
    mediaUrl?: string
    scheduledAt?: Date
  }
): Promise<Campaign> => {
  const campaign = await Campaign.findOne({ where: { id, tenantId } })

  if (!campaign) {
    throw new AppError("Campaign not found", 404)
  }

  if (campaign.status !== "pending") {
    throw new AppError("Only pending campaigns can be updated", 400)
  }

  if (data.whatsappId) {
    const whatsapp = await WhatsApp.findOne({
      where: { id: data.whatsappId, tenantId }
    })

    if (!whatsapp) {
      throw new AppError("WhatsApp connection not found", 404)
    }
  }

  await campaign.update(data)

  const updatedCampaign = await findCampaignById(id, tenantId)

  emitToTenant(tenantId, "campaign:updated", updatedCampaign)

  return updatedCampaign
}

export const startCampaign = async (id: number, tenantId: number): Promise<Campaign> => {
  const campaign = await Campaign.findOne({ where: { id, tenantId } })

  if (!campaign) {
    throw new AppError("Campaign not found", 404)
  }

  if (campaign.status !== "pending") {
    throw new AppError("Only pending campaigns can be started", 400)
  }

  const contactCount = await CampaignContact.count({
    where: { campaignId: id }
  })

  if (contactCount === 0) {
    throw new AppError("Campaign has no contacts", 400)
  }

  const queue = getQueue(CAMPAIGN_QUEUE)
  await queue.add({ campaignId: id, tenantId })

  emitToTenant(tenantId, "campaign:started", { id })

  return campaign
}

export const cancelCampaign = async (id: number, tenantId: number): Promise<Campaign> => {
  const campaign = await Campaign.findOne({ where: { id, tenantId } })

  if (!campaign) {
    throw new AppError("Campaign not found", 404)
  }

  if (campaign.status === "completed") {
    throw new AppError("Completed campaigns cannot be cancelled", 400)
  }

  if (campaign.status === "cancelled") {
    throw new AppError("Campaign is already cancelled", 400)
  }

  await campaign.update({ status: "cancelled" })

  const cancelledCampaign = await findCampaignById(id, tenantId)

  emitToTenant(tenantId, "campaign:cancelled", cancelledCampaign)

  return cancelledCampaign
}

export const addContactsToCampaign = async (
  id: number,
  tenantId: number,
  contactIds: number[]
): Promise<void> => {
  const campaign = await Campaign.findOne({ where: { id, tenantId } })

  if (!campaign) {
    throw new AppError("Campaign not found", 404)
  }

  if (campaign.status !== "pending") {
    throw new AppError("Only pending campaigns can have contacts added", 400)
  }

  const contacts = await Contact.findAll({
    where: {
      id: { [Op.in]: contactIds },
      tenantId
    }
  })

  if (contacts.length !== contactIds.length) {
    throw new AppError("One or more contacts not found", 404)
  }

  const existingCampaignContacts = await CampaignContact.findAll({
    where: {
      campaignId: id,
      contactId: { [Op.in]: contactIds }
    }
  })

  const existingContactIds = existingCampaignContacts.map(cc => cc.contactId)
  const newContactIds = contactIds.filter(cId => !existingContactIds.includes(cId))

  if (newContactIds.length > 0) {
    const entries = newContactIds.map(contactId => ({
      campaignId: id,
      contactId,
      status: "pending"
    }))

    await CampaignContact.bulkCreate(entries)
  }

  emitToTenant(tenantId, "campaign:contacts-added", { campaignId: id, contactIds: newContactIds })
}

export const removeContactFromCampaign = async (
  id: number,
  contactId: number,
  tenantId: number
): Promise<void> => {
  const campaign = await Campaign.findOne({ where: { id, tenantId } })

  if (!campaign) {
    throw new AppError("Campaign not found", 404)
  }

  if (campaign.status !== "pending") {
    throw new AppError("Only pending campaigns can have contacts removed", 400)
  }

  const campaignContact = await CampaignContact.findOne({
    where: { campaignId: id, contactId }
  })

  if (!campaignContact) {
    throw new AppError("Contact not found in this campaign", 404)
  }

  await campaignContact.destroy()

  emitToTenant(tenantId, "campaign:contact-removed", { campaignId: id, contactId })
}

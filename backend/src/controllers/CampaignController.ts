import { Request, Response } from "express"

import * as CampaignService from "../services/CampaignService"
import {
  createCampaignSchema,
  updateCampaignSchema,
  addContactsSchema
} from "../validators/CampaignValidator"

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { pageNumber, limit, status } = req.query

  const { campaigns, count, hasMore } = await CampaignService.listCampaigns({
    tenantId,
    pageNumber: String(pageNumber || "1"),
    limit: String(limit || "20"),
    status: status ? String(status) : undefined
  })

  return res.json({
    success: true,
    data: campaigns,
    meta: {
      total: count,
      page: Number(pageNumber || 1),
      limit: Number(limit || 20),
      hasMore
    }
  })
}

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const campaign = await CampaignService.findCampaignById(Number(id), tenantId)

  return res.json({
    success: true,
    data: campaign
  })
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req

  const validated = await createCampaignSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const campaign = await CampaignService.createCampaign(tenantId, validated)

  return res.status(201).json({
    success: true,
    data: campaign
  })
}

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const validated = await updateCampaignSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const campaign = await CampaignService.updateCampaign(Number(id), tenantId, validated)

  return res.json({
    success: true,
    data: campaign
  })
}

export const start = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const campaign = await CampaignService.startCampaign(Number(id), tenantId)

  return res.json({
    success: true,
    data: campaign
  })
}

export const cancel = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const campaign = await CampaignService.cancelCampaign(Number(id), tenantId)

  return res.json({
    success: true,
    data: campaign
  })
}

export const addContacts = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const validated = await addContactsSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  await CampaignService.addContactsToCampaign(Number(id), tenantId, validated.contactIds)

  return res.json({
    success: true,
    data: { message: "Contacts added to campaign successfully" }
  })
}

export const removeContact = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id, contactId } = req.params

  await CampaignService.removeContactFromCampaign(Number(id), Number(contactId), tenantId)

  return res.json({
    success: true,
    data: { message: "Contact removed from campaign successfully" }
  })
}

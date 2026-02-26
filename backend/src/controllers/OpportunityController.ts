import { Request, Response } from "express"

import * as OpportunityService from "../services/OpportunityService"
import {
  createOpportunitySchema,
  updateOpportunitySchema,
  moveOpportunitySchema
} from "../validators/OpportunityValidator"

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { pageNumber, limit, pipelineId, stageId, status, contactId } = req.query

  const { opportunities, count, hasMore } = await OpportunityService.listOpportunities({
    tenantId,
    pageNumber: String(pageNumber || "1"),
    limit: String(limit || "20"),
    pipelineId: pipelineId ? Number(pipelineId) : undefined,
    stageId: stageId ? Number(stageId) : undefined,
    status: status ? String(status) : undefined,
    contactId: contactId ? Number(contactId) : undefined
  })

  return res.json({
    success: true,
    data: opportunities,
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

  const opportunity = await OpportunityService.findOpportunityById(Number(id), tenantId)

  return res.json({
    success: true,
    data: opportunity
  })
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req

  const validated = await createOpportunitySchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const opportunity = await OpportunityService.createOpportunity(tenantId, validated)

  return res.status(201).json({
    success: true,
    data: opportunity
  })
}

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const validated = await updateOpportunitySchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const opportunity = await OpportunityService.updateOpportunity(Number(id), tenantId, validated)

  return res.json({
    success: true,
    data: opportunity
  })
}

export const move = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const validated = await moveOpportunitySchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const opportunity = await OpportunityService.moveOpportunity(
    Number(id),
    tenantId,
    validated.stageId
  )

  return res.json({
    success: true,
    data: opportunity
  })
}

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  await OpportunityService.deleteOpportunity(Number(id), tenantId)

  return res.json({
    success: true,
    data: { message: "Opportunity deleted successfully" }
  })
}

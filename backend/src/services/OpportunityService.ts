import { Op } from "sequelize"

import Opportunity from "../models/Opportunity"
import Contact from "../models/Contact"
import Pipeline from "../models/Pipeline"
import Stage from "../models/Stage"
import { AppError } from "../helpers/AppError"
import { emitToTenant } from "../libs/socket"

interface ListParams {
  tenantId: number
  pageNumber?: string | number
  limit?: string | number
  pipelineId?: number
  stageId?: number
  status?: string
  contactId?: number
}

interface ListResult {
  opportunities: Opportunity[]
  count: number
  hasMore: boolean
}

export const listOpportunities = async ({
  tenantId,
  pageNumber = "1",
  limit = "20",
  pipelineId,
  stageId,
  status,
  contactId
}: ListParams): Promise<ListResult> => {
  const offset = (Number(pageNumber) - 1) * Number(limit)

  const where: Record<string, unknown> = { tenantId }

  if (pipelineId) {
    where.pipelineId = pipelineId
  }

  if (stageId) {
    where.stageId = stageId
  }

  if (status) {
    where.status = status
  }

  if (contactId) {
    where.contactId = contactId
  }

  const { rows: opportunities, count } = await Opportunity.findAndCountAll({
    where,
    include: [
      {
        model: Contact,
        as: "contact",
        attributes: ["id", "name", "number"]
      },
      {
        model: Pipeline,
        as: "pipeline",
        attributes: ["id", "name"]
      },
      {
        model: Stage,
        as: "stage",
        attributes: ["id", "name"]
      }
    ],
    limit: Number(limit),
    offset,
    order: [["createdAt", "DESC"]]
  })

  const hasMore = count > offset + opportunities.length

  return { opportunities, count, hasMore }
}

export const findOpportunityById = async (id: number, tenantId: number): Promise<Opportunity> => {
  const opportunity = await Opportunity.findOne({
    where: { id, tenantId },
    include: [
      {
        model: Contact,
        as: "contact",
        attributes: ["id", "name", "number"]
      },
      {
        model: Pipeline,
        as: "pipeline",
        attributes: ["id", "name"]
      },
      {
        model: Stage,
        as: "stage",
        attributes: ["id", "name"]
      }
    ]
  })

  if (!opportunity) {
    throw new AppError("Opportunity not found", 404)
  }

  return opportunity
}

export const createOpportunity = async (
  tenantId: number,
  data: {
    contactId: number
    pipelineId: number
    stageId: number
    value?: number
    status?: string
  }
): Promise<Opportunity> => {
  const contact = await Contact.findOne({
    where: { id: data.contactId, tenantId }
  })

  if (!contact) {
    throw new AppError("Contact not found", 404)
  }

  const pipeline = await Pipeline.findOne({
    where: { id: data.pipelineId, tenantId }
  })

  if (!pipeline) {
    throw new AppError("Pipeline not found", 404)
  }

  const stage = await Stage.findOne({
    where: { id: data.stageId, pipelineId: data.pipelineId }
  })

  if (!stage) {
    throw new AppError("Stage not found or does not belong to the specified pipeline", 404)
  }

  const opportunity = await Opportunity.create({
    tenantId,
    contactId: data.contactId,
    pipelineId: data.pipelineId,
    stageId: data.stageId,
    value: data.value || 0,
    status: data.status || "open"
  })

  const createdOpportunity = await findOpportunityById(opportunity.id, tenantId)

  emitToTenant(tenantId, "opportunity:created", createdOpportunity)

  return createdOpportunity
}

export const updateOpportunity = async (
  id: number,
  tenantId: number,
  data: {
    contactId?: number
    pipelineId?: number
    stageId?: number
    value?: number
    status?: string
  }
): Promise<Opportunity> => {
  const opportunity = await Opportunity.findOne({ where: { id, tenantId } })

  if (!opportunity) {
    throw new AppError("Opportunity not found", 404)
  }

  if (data.contactId) {
    const contact = await Contact.findOne({
      where: { id: data.contactId, tenantId }
    })

    if (!contact) {
      throw new AppError("Contact not found", 404)
    }
  }

  if (data.pipelineId) {
    const pipeline = await Pipeline.findOne({
      where: { id: data.pipelineId, tenantId }
    })

    if (!pipeline) {
      throw new AppError("Pipeline not found", 404)
    }
  }

  if (data.stageId) {
    const pipelineIdToCheck = data.pipelineId || opportunity.pipelineId

    const stage = await Stage.findOne({
      where: { id: data.stageId, pipelineId: pipelineIdToCheck }
    })

    if (!stage) {
      throw new AppError("Stage not found or does not belong to the specified pipeline", 404)
    }
  }

  await opportunity.update(data)

  const updatedOpportunity = await findOpportunityById(id, tenantId)

  emitToTenant(tenantId, "opportunity:updated", updatedOpportunity)

  return updatedOpportunity
}

export const moveOpportunity = async (
  id: number,
  tenantId: number,
  stageId: number
): Promise<Opportunity> => {
  const opportunity = await Opportunity.findOne({ where: { id, tenantId } })

  if (!opportunity) {
    throw new AppError("Opportunity not found", 404)
  }

  const stage = await Stage.findOne({
    where: { id: stageId, pipelineId: opportunity.pipelineId }
  })

  if (!stage) {
    throw new AppError("Stage not found or does not belong to the opportunity's pipeline", 404)
  }

  await opportunity.update({ stageId })

  const movedOpportunity = await findOpportunityById(id, tenantId)

  emitToTenant(tenantId, "opportunity:moved", movedOpportunity)

  return movedOpportunity
}

export const deleteOpportunity = async (id: number, tenantId: number): Promise<void> => {
  const opportunity = await Opportunity.findOne({ where: { id, tenantId } })

  if (!opportunity) {
    throw new AppError("Opportunity not found", 404)
  }

  await opportunity.destroy()

  emitToTenant(tenantId, "opportunity:deleted", { id })
}

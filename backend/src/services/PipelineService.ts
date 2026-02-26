import { Op } from "sequelize"

import Pipeline from "../models/Pipeline"
import Opportunity from "../models/Opportunity"
import { AppError } from "../helpers/AppError"
import { emitToTenant } from "../libs/socket"

interface ListParams {
  tenantId: number
  searchParam?: string
}

export const listPipelines = async ({ tenantId, searchParam = "" }: ListParams): Promise<Pipeline[]> => {
  const where: Record<string, unknown> = { tenantId }

  if (searchParam) {
    where.name = { [Op.iLike]: `%${searchParam}%` }
  }

  const pipelines = await Pipeline.findAll({
    where,
    order: [["name", "ASC"]]
  })

  return pipelines
}

export const findPipelineById = async (id: number, tenantId: number): Promise<Pipeline> => {
  const pipeline = await Pipeline.findOne({
    where: { id, tenantId },
    include: [
      {
        model: Opportunity,
        as: "opportunities",
        attributes: []
      }
    ],
    attributes: {
      include: [
        [
          Pipeline.sequelize!.fn("COUNT", Pipeline.sequelize!.col("opportunities.id")),
          "opportunitiesCount"
        ]
      ]
    },
    group: ["Pipeline.id"]
  })

  if (!pipeline) {
    throw new AppError("Pipeline not found", 404)
  }

  return pipeline
}

export const createPipeline = async (tenantId: number, data: {
  name: string
}): Promise<Pipeline> => {
  const existingPipeline = await Pipeline.findOne({
    where: { name: { [Op.iLike]: data.name }, tenantId }
  })

  if (existingPipeline) {
    throw new AppError("A pipeline with this name already exists", 409)
  }

  const pipeline = await Pipeline.create({
    tenantId,
    name: data.name
  })

  emitToTenant(tenantId, "pipeline:created", pipeline)

  return pipeline
}

export const updatePipeline = async (id: number, tenantId: number, data: {
  name?: string
}): Promise<Pipeline> => {
  const pipeline = await Pipeline.findOne({ where: { id, tenantId } })

  if (!pipeline) {
    throw new AppError("Pipeline not found", 404)
  }

  if (data.name) {
    const existingPipeline = await Pipeline.findOne({
      where: {
        name: { [Op.iLike]: data.name },
        tenantId,
        id: { [Op.ne]: id }
      }
    })

    if (existingPipeline) {
      throw new AppError("A pipeline with this name already exists", 409)
    }
  }

  await pipeline.update(data)

  emitToTenant(tenantId, "pipeline:updated", pipeline)

  return pipeline
}

export const deletePipeline = async (id: number, tenantId: number): Promise<void> => {
  const pipeline = await Pipeline.findOne({ where: { id, tenantId } })

  if (!pipeline) {
    throw new AppError("Pipeline not found", 404)
  }

  const opportunitiesCount = await Opportunity.count({
    where: { pipelineId: id }
  })

  if (opportunitiesCount > 0) {
    throw new AppError("Cannot delete pipeline with existing opportunities", 409)
  }

  await pipeline.destroy()

  emitToTenant(tenantId, "pipeline:deleted", { id })
}

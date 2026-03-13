import { Op } from "sequelize"

import Pipeline from "../models/Pipeline"
import Stage from "../models/Stage"
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
        model: Stage,
        as: "stages",
        order: [["order", "ASC"]]
      }
    ],
    order: [[{ model: Stage, as: "stages" }, "order", "ASC"]]
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

export const createPipelineStage = async (
  pipelineId: number,
  tenantId: number,
  data: { name: string; order: number; color?: string }
): Promise<Stage> => {
  const pipeline = await Pipeline.findOne({ where: { id: pipelineId, tenantId } })

  if (!pipeline) {
    throw new AppError("Pipeline not found", 404)
  }

  const stage = await Stage.create({
    pipelineId,
    kanbanId: null,
    name: data.name,
    color: data.color || "#6B7280",
    order: data.order
  })

  emitToTenant(tenantId, "stage:created", stage)

  return stage
}

export const updatePipelineStage = async (
  pipelineId: number,
  stageId: number,
  tenantId: number,
  data: { name?: string; order?: number; color?: string }
): Promise<Stage> => {
  const pipeline = await Pipeline.findOne({ where: { id: pipelineId, tenantId } })

  if (!pipeline) {
    throw new AppError("Pipeline not found", 404)
  }

  const stage = await Stage.findOne({ where: { id: stageId, pipelineId } })

  if (!stage) {
    throw new AppError("Stage not found", 404)
  }

  await stage.update(data)

  emitToTenant(tenantId, "stage:updated", stage)

  return stage
}

export const deletePipelineStage = async (
  pipelineId: number,
  stageId: number,
  tenantId: number
): Promise<void> => {
  const pipeline = await Pipeline.findOne({ where: { id: pipelineId, tenantId } })

  if (!pipeline) {
    throw new AppError("Pipeline not found", 404)
  }

  const stage = await Stage.findOne({ where: { id: stageId, pipelineId } })

  if (!stage) {
    throw new AppError("Stage not found", 404)
  }

  const opportunitiesCount = await Opportunity.count({
    where: { stageId }
  })

  if (opportunitiesCount > 0) {
    throw new AppError("Nao e possivel excluir etapa com oportunidades vinculadas", 409)
  }

  await stage.destroy()

  emitToTenant(tenantId, "stage:deleted", { id: stageId, pipelineId })
}

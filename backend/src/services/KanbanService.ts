import { Op } from "sequelize"

import Kanban from "../models/Kanban"
import Stage from "../models/Stage"
import Opportunity from "../models/Opportunity"
import { AppError } from "../helpers/AppError"
import { emitToTenant } from "../libs/socket"

interface ListParams {
  tenantId: number
  searchParam?: string
}

export const listKanbans = async ({ tenantId, searchParam = "" }: ListParams): Promise<Kanban[]> => {
  const where: Record<string, unknown> = { tenantId }

  if (searchParam) {
    where.name = { [Op.iLike]: `%${searchParam}%` }
  }

  const kanbans = await Kanban.findAll({
    where,
    order: [["name", "ASC"]]
  })

  return kanbans
}

export const findKanbanById = async (id: number, tenantId: number): Promise<Kanban> => {
  const kanban = await Kanban.findOne({
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

  if (!kanban) {
    throw new AppError("Kanban not found", 404)
  }

  return kanban
}

export const createKanban = async (tenantId: number, data: {
  name: string
  isActive?: boolean
}): Promise<Kanban> => {
  const existingKanban = await Kanban.findOne({
    where: { name: { [Op.iLike]: data.name }, tenantId }
  })

  if (existingKanban) {
    throw new AppError("A kanban with this name already exists", 409)
  }

  const kanban = await Kanban.create({
    tenantId,
    name: data.name,
    isActive: data.isActive ?? true
  })

  emitToTenant(tenantId, "kanban:created", kanban)

  return kanban
}

export const updateKanban = async (id: number, tenantId: number, data: {
  name?: string
  isActive?: boolean
}): Promise<Kanban> => {
  const kanban = await Kanban.findOne({ where: { id, tenantId } })

  if (!kanban) {
    throw new AppError("Kanban not found", 404)
  }

  if (data.name) {
    const existingKanban = await Kanban.findOne({
      where: {
        name: { [Op.iLike]: data.name },
        tenantId,
        id: { [Op.ne]: id }
      }
    })

    if (existingKanban) {
      throw new AppError("A kanban with this name already exists", 409)
    }
  }

  await kanban.update(data)

  emitToTenant(tenantId, "kanban:updated", kanban)

  return kanban
}

export const deleteKanban = async (id: number, tenantId: number): Promise<void> => {
  const kanban = await Kanban.findOne({
    where: { id, tenantId },
    include: [{ model: Stage, as: "stages" }]
  })

  if (!kanban) {
    throw new AppError("Kanban not found", 404)
  }

  const stageIds = kanban.stages.map(stage => stage.id)

  if (stageIds.length > 0) {
    const opportunitiesCount = await Opportunity.count({
      where: { stageId: { [Op.in]: stageIds } }
    })

    if (opportunitiesCount > 0) {
      throw new AppError("Cannot delete kanban with stages that have opportunities", 409)
    }

    await Stage.destroy({ where: { kanbanId: id } })
  }

  await kanban.destroy()

  emitToTenant(tenantId, "kanban:deleted", { id })
}

export const createStage = async (kanbanId: number, tenantId: number, data: {
  name: string
  order: number
}): Promise<Stage> => {
  const kanban = await Kanban.findOne({ where: { id: kanbanId, tenantId } })

  if (!kanban) {
    throw new AppError("Kanban not found", 404)
  }

  const stage = await Stage.create({
    kanbanId,
    name: data.name,
    order: data.order
  })

  emitToTenant(tenantId, "stage:created", stage)

  return stage
}

export const updateStage = async (kanbanId: number, stageId: number, tenantId: number, data: {
  name?: string
  order?: number
}): Promise<Stage> => {
  const kanban = await Kanban.findOne({ where: { id: kanbanId, tenantId } })

  if (!kanban) {
    throw new AppError("Kanban not found", 404)
  }

  const stage = await Stage.findOne({ where: { id: stageId, kanbanId } })

  if (!stage) {
    throw new AppError("Stage not found", 404)
  }

  await stage.update(data)

  emitToTenant(tenantId, "stage:updated", stage)

  return stage
}

export const deleteStage = async (kanbanId: number, stageId: number, tenantId: number): Promise<void> => {
  const kanban = await Kanban.findOne({ where: { id: kanbanId, tenantId } })

  if (!kanban) {
    throw new AppError("Kanban not found", 404)
  }

  const stage = await Stage.findOne({ where: { id: stageId, kanbanId } })

  if (!stage) {
    throw new AppError("Stage not found", 404)
  }

  const opportunitiesCount = await Opportunity.count({
    where: { stageId }
  })

  if (opportunitiesCount > 0) {
    throw new AppError("Cannot delete stage with existing opportunities", 409)
  }

  await stage.destroy()

  emitToTenant(tenantId, "stage:deleted", { id: stageId, kanbanId })
}

export const reorderStages = async (kanbanId: number, tenantId: number, data: {
  stages: Array<{ id: number; order: number }>
}): Promise<Stage[]> => {
  const kanban = await Kanban.findOne({ where: { id: kanbanId, tenantId } })

  if (!kanban) {
    throw new AppError("Kanban not found", 404)
  }

  const stageIds = data.stages.map(s => s.id)
  const stages = await Stage.findAll({
    where: { id: { [Op.in]: stageIds }, kanbanId }
  })

  if (stages.length !== data.stages.length) {
    throw new AppError("One or more stages not found", 404)
  }

  await Promise.all(
    data.stages.map(async ({ id, order }) => {
      await Stage.update({ order }, { where: { id, kanbanId } })
    })
  )

  const updatedStages = await Stage.findAll({
    where: { kanbanId },
    order: [["order", "ASC"]]
  })

  emitToTenant(tenantId, "stages:reordered", { kanbanId, stages: updatedStages })

  return updatedStages
}

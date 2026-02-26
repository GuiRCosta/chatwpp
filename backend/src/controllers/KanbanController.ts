import { Request, Response } from "express"

import * as KanbanService from "../services/KanbanService"
import {
  createKanbanSchema,
  updateKanbanSchema,
  createStageSchema,
  updateStageSchema,
  reorderStagesSchema
} from "../validators/KanbanValidator"

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { searchParam } = req.query

  const kanbans = await KanbanService.listKanbans({
    tenantId,
    searchParam: String(searchParam || "")
  })

  return res.json({
    success: true,
    data: kanbans
  })
}

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const kanban = await KanbanService.findKanbanById(Number(id), tenantId)

  return res.json({
    success: true,
    data: kanban
  })
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req

  const validated = await createKanbanSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const kanban = await KanbanService.createKanban(tenantId, validated)

  return res.status(201).json({
    success: true,
    data: kanban
  })
}

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const validated = await updateKanbanSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const kanban = await KanbanService.updateKanban(Number(id), tenantId, validated)

  return res.json({
    success: true,
    data: kanban
  })
}

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  await KanbanService.deleteKanban(Number(id), tenantId)

  return res.json({
    success: true,
    data: { message: "Kanban deleted successfully" }
  })
}

export const createStage = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { kanbanId } = req.params

  const validated = await createStageSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const stage = await KanbanService.createStage(Number(kanbanId), tenantId, validated)

  return res.status(201).json({
    success: true,
    data: stage
  })
}

export const updateStage = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { kanbanId, stageId } = req.params

  const validated = await updateStageSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const stage = await KanbanService.updateStage(Number(kanbanId), Number(stageId), tenantId, validated)

  return res.json({
    success: true,
    data: stage
  })
}

export const removeStage = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { kanbanId, stageId } = req.params

  await KanbanService.deleteStage(Number(kanbanId), Number(stageId), tenantId)

  return res.json({
    success: true,
    data: { message: "Stage deleted successfully" }
  })
}

export const reorderStages = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { kanbanId } = req.params

  const validated = await reorderStagesSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const stages = await KanbanService.reorderStages(Number(kanbanId), tenantId, validated)

  return res.json({
    success: true,
    data: stages
  })
}

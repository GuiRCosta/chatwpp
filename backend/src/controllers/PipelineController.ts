import { Request, Response } from "express"

import * as PipelineService from "../services/PipelineService"
import { createPipelineSchema, updatePipelineSchema } from "../validators/PipelineValidator"

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { searchParam } = req.query

  const pipelines = await PipelineService.listPipelines({
    tenantId,
    searchParam: String(searchParam || "")
  })

  return res.json({
    success: true,
    data: pipelines
  })
}

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const pipeline = await PipelineService.findPipelineById(Number(id), tenantId)

  return res.json({
    success: true,
    data: pipeline
  })
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req

  const validated = await createPipelineSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const pipeline = await PipelineService.createPipeline(tenantId, validated)

  return res.status(201).json({
    success: true,
    data: pipeline
  })
}

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const validated = await updatePipelineSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const pipeline = await PipelineService.updatePipeline(Number(id), tenantId, validated)

  return res.json({
    success: true,
    data: pipeline
  })
}

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  await PipelineService.deletePipeline(Number(id), tenantId)

  return res.json({
    success: true,
    data: { message: "Pipeline deleted successfully" }
  })
}

import { Request, Response } from "express"

import * as QueueService from "../services/QueueService"
import { createQueueSchema, updateQueueSchema } from "../validators/QueueValidator"

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { searchParam } = req.query

  const queues = await QueueService.listQueues({
    tenantId,
    searchParam: String(searchParam || "")
  })

  return res.json({
    success: true,
    data: queues
  })
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req

  const validated = await createQueueSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const queue = await QueueService.createQueue(tenantId, validated)

  return res.status(201).json({
    success: true,
    data: queue
  })
}

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const validated = await updateQueueSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const queue = await QueueService.updateQueue(Number(id), tenantId, validated)

  return res.json({
    success: true,
    data: queue
  })
}

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  await QueueService.deleteQueue(Number(id), tenantId)

  return res.json({
    success: true,
    data: { message: "Queue deleted successfully" }
  })
}

import { Request, Response } from "express"

import * as DeadLetterService from "../services/DeadLetterService"

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req

  const result = await DeadLetterService.listDeadLetterJobs(tenantId)

  return res.json({
    success: true,
    data: result.jobs,
    meta: { count: result.count }
  })
}

export const retry = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { jobId } = req.params

  await DeadLetterService.retryDeadLetterJob(jobId, tenantId)

  return res.json({
    success: true,
    data: { message: `Job ${jobId} re-enqueued for retry` }
  })
}

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { jobId } = req.params

  await DeadLetterService.deleteDeadLetterJob(jobId, tenantId)

  return res.json({
    success: true,
    data: { message: `Job ${jobId} deleted from dead letter queue` }
  })
}

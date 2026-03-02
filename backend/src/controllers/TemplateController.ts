import { Request, Response } from "express"

import * as TemplateService from "../services/TemplateService"

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { whatsappId } = req.query

  const templates = await TemplateService.listTemplates(
    tenantId,
    whatsappId ? Number(whatsappId) : undefined
  )

  return res.json({
    success: true,
    data: templates
  })
}

export const sync = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { whatsappId } = req.body

  const results = await TemplateService.syncTemplates(
    tenantId,
    whatsappId ? Number(whatsappId) : undefined
  )

  return res.json({
    success: true,
    data: results
  })
}

import { Request, Response } from "express"

import * as TemplateService from "../services/TemplateService"
import {
  listTemplatesSchema,
  syncTemplatesSchema
} from "../validators/TemplateValidator"

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const validated = await listTemplatesSchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true
  })

  const templates = await TemplateService.listTemplates(
    tenantId,
    validated.whatsappId ?? undefined
  )

  return res.json({
    success: true,
    data: templates
  })
}

export const sync = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const validated = await syncTemplatesSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const results = await TemplateService.syncTemplates(
    tenantId,
    validated.whatsappId ?? undefined
  )

  return res.json({
    success: true,
    data: results
  })
}

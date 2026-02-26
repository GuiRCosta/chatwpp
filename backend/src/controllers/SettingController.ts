import { Request, Response } from "express"

import * as SettingService from "../services/SettingService"
import { updateSettingSchema, updateSettingsBulkSchema } from "../validators/SettingValidator"

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req

  const settings = await SettingService.getSettings(tenantId)

  return res.json({
    success: true,
    data: settings
  })
}

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req

  const validated = await updateSettingSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const setting = await SettingService.updateSetting(
    tenantId,
    validated.key,
    validated.value
  )

  return res.json({
    success: true,
    data: setting
  })
}

export const updateBulk = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req

  const validated = await updateSettingsBulkSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const settings = await SettingService.updateSettingsBulk(tenantId, validated.settings)

  return res.json({
    success: true,
    data: settings
  })
}

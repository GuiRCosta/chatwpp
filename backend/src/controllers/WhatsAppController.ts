import { Request, Response } from "express"

import * as WhatsAppService from "../services/WhatsAppService"
import { createWhatsAppSchema, updateWhatsAppSchema, onboardFBLSchema } from "../validators/WhatsAppValidator"

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req

  const whatsapps = await WhatsAppService.listWhatsApps({ tenantId })

  return res.json({
    success: true,
    data: whatsapps
  })
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req

  const validated = await createWhatsAppSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const whatsapp = await WhatsAppService.createWhatsApp(tenantId, validated)

  return res.status(201).json({
    success: true,
    data: whatsapp
  })
}

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const validated = await updateWhatsAppSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const whatsapp = await WhatsAppService.updateWhatsApp(Number(id), tenantId, validated)

  return res.json({
    success: true,
    data: whatsapp
  })
}

export const onboard = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req

  const validated = await onboardFBLSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const whatsapp = await WhatsAppService.onboardFromFBL(tenantId, validated)

  return res.status(201).json({
    success: true,
    data: whatsapp
  })
}

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  await WhatsAppService.deleteWhatsApp(Number(id), tenantId)

  return res.json({
    success: true,
    data: { message: "WhatsApp connection deleted successfully" }
  })
}

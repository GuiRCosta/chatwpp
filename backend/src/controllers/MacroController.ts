import { Request, Response } from "express"
import * as MacroService from "../services/MacroService"
import {
  createMacroSchema,
  updateMacroSchema,
  executeMacroSchema
} from "../validators/MacroValidator"

export const index = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { tenantId, userId } = req
  const { searchParam, whatsappId } = req.query

  const macros = await MacroService.listMacros({
    tenantId,
    userId,
    searchParam: String(searchParam || ""),
    whatsappId: whatsappId ? Number(whatsappId) : undefined
  })

  return res.json({ success: true, data: macros })
}

export const show = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { tenantId, userId } = req
  const { id } = req.params

  const macro = await MacroService.findMacroById(
    Number(id),
    tenantId,
    userId
  )

  return res.json({ success: true, data: macro })
}

export const store = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { tenantId, userId } = req

  const validated = await createMacroSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const macro = await MacroService.createMacro(
    tenantId,
    userId,
    validated as {
      name: string
      description?: string | null
      actions: { type: string; params: Record<string, unknown> }[]
      visibility: "personal" | "global"
      whatsappIds?: number[] | null
    }
  )

  return res.status(201).json({ success: true, data: macro })
}

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { tenantId, userId, userProfile } = req
  const { id } = req.params

  const validated = await updateMacroSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const macro = await MacroService.updateMacro(
    Number(id),
    tenantId,
    userId,
    userProfile,
    validated as {
      name?: string
      description?: string | null
      actions?: { type: string; params: Record<string, unknown> }[]
      visibility?: string
      isActive?: boolean
      whatsappIds?: number[] | null
    }
  )

  return res.json({ success: true, data: macro })
}

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { tenantId, userId, userProfile } = req
  const { id } = req.params

  await MacroService.deleteMacro(
    Number(id),
    tenantId,
    userId,
    userProfile
  )

  return res.json({
    success: true,
    data: { message: "Macro deleted successfully" }
  })
}

export const execute = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { tenantId, userId } = req
  const { id } = req.params

  const validated = await executeMacroSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const results = await MacroService.executeMacro(
    Number(id),
    validated.ticketIds as number[],
    tenantId,
    userId
  )

  return res.json({ success: true, data: results })
}

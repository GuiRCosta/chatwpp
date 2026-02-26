import { Request, Response } from "express"

import * as TagService from "../services/TagService"
import { createTagSchema, updateTagSchema } from "../validators/TagValidator"

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { searchParam } = req.query

  const tags = await TagService.listTags({
    tenantId,
    searchParam: String(searchParam || "")
  })

  return res.json({
    success: true,
    data: tags
  })
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req

  const validated = await createTagSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const tag = await TagService.createTag(tenantId, validated)

  return res.status(201).json({
    success: true,
    data: tag
  })
}

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const validated = await updateTagSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const tag = await TagService.updateTag(Number(id), tenantId, validated)

  return res.json({
    success: true,
    data: tag
  })
}

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  await TagService.deleteTag(Number(id), tenantId)

  return res.json({
    success: true,
    data: { message: "Tag deleted successfully" }
  })
}

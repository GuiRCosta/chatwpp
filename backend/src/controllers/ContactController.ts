import { Request, Response } from "express"

import * as ContactService from "../services/ContactService"
import { createContactSchema, updateContactSchema } from "../validators/ContactValidator"

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { searchParam, pageNumber, limit, tags } = req.query

  const parsedTags = tags
    ? String(tags).split(",").map(Number).filter(Boolean)
    : undefined

  const { contacts, count, hasMore } = await ContactService.listContacts({
    tenantId,
    searchParam: String(searchParam || ""),
    pageNumber: String(pageNumber || "1"),
    limit: String(limit || "20"),
    tags: parsedTags
  })

  return res.json({
    success: true,
    data: contacts,
    meta: {
      total: count,
      page: Number(pageNumber || 1),
      limit: Number(limit || 20),
      hasMore
    }
  })
}

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const contact = await ContactService.findContactById(Number(id), tenantId)

  return res.json({
    success: true,
    data: contact
  })
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req

  const validated = await createContactSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const contact = await ContactService.createContact(tenantId, validated)

  return res.status(201).json({
    success: true,
    data: contact
  })
}

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const validated = await updateContactSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const contact = await ContactService.updateContact(Number(id), tenantId, validated)

  return res.json({
    success: true,
    data: contact
  })
}

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  await ContactService.deleteContact(Number(id), tenantId)

  return res.json({
    success: true,
    data: { message: "Contact deleted successfully" }
  })
}

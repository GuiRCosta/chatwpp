import { Request, Response } from "express"

import * as TenantService from "../services/TenantService"
import { createTenantSchema, updateTenantSchema } from "../validators/TenantValidator"

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber, limit } = req.query

  const { tenants, count, hasMore } = await TenantService.listTenants({
    searchParam: String(searchParam || ""),
    pageNumber: String(pageNumber || "1"),
    limit: String(limit || "20")
  })

  return res.json({
    success: true,
    data: tenants,
    meta: {
      total: count,
      page: Number(pageNumber || 1),
      limit: Number(limit || 20),
      hasMore
    }
  })
}

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params

  const tenant = await TenantService.findTenantById(Number(id))

  return res.json({
    success: true,
    data: tenant
  })
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const validated = await createTenantSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const tenant = await TenantService.createTenant(validated)

  return res.status(201).json({
    success: true,
    data: tenant
  })
}

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params

  const validated = await updateTenantSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const tenant = await TenantService.updateTenant(Number(id), validated)

  return res.json({
    success: true,
    data: tenant
  })
}

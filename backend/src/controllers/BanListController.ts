import { Request, Response } from "express"

import * as BanListService from "../services/BanListService"
import { createBanListSchema } from "../validators/BanListValidator"

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { searchParam } = req.query

  const banLists = await BanListService.listBanLists({
    tenantId,
    searchParam: String(searchParam || "")
  })

  return res.json({
    success: true,
    data: banLists
  })
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req

  const validated = await createBanListSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const banList = await BanListService.createBanList(tenantId, validated)

  return res.status(201).json({
    success: true,
    data: banList
  })
}

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  await BanListService.deleteBanList(Number(id), tenantId)

  return res.json({
    success: true,
    data: { message: "Ban list deleted successfully" }
  })
}

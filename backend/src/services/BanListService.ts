import { Op } from "sequelize"

import BanList from "../models/BanList"
import { AppError } from "../helpers/AppError"
import { emitToTenant } from "../libs/socket"

interface ListParams {
  tenantId: number
  searchParam?: string
}

export const listBanLists = async ({ tenantId, searchParam = "" }: ListParams): Promise<BanList[]> => {
  const where: Record<string, unknown> = { tenantId }

  if (searchParam) {
    where.number = { [Op.iLike]: `%${searchParam}%` }
  }

  const banLists = await BanList.findAll({
    where,
    order: [["createdAt", "DESC"]]
  })

  return banLists
}

export const createBanList = async (tenantId: number, data: {
  number: string
}): Promise<BanList> => {
  const existingBanList = await BanList.findOne({
    where: { number: data.number, tenantId }
  })

  if (existingBanList) {
    throw new AppError("A ban list with this number already exists", 409)
  }

  const banList = await BanList.create({
    tenantId,
    number: data.number
  })

  emitToTenant(tenantId, "banlist:created", banList)

  return banList
}

export const deleteBanList = async (id: number, tenantId: number): Promise<void> => {
  const banList = await BanList.findOne({ where: { id, tenantId } })

  if (!banList) {
    throw new AppError("Ban list not found", 404)
  }

  await banList.destroy()

  emitToTenant(tenantId, "banlist:deleted", { id })
}

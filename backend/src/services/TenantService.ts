import { Op } from "sequelize"

import Tenant from "../models/Tenant"
import User from "../models/User"
import { AppError } from "../helpers/AppError"

interface ListParams {
  searchParam?: string
  pageNumber?: string | number
  limit?: string | number
}

interface ListResult {
  tenants: Tenant[]
  count: number
  hasMore: boolean
}

export const listTenants = async ({ searchParam = "", pageNumber = "1", limit = "20" }: ListParams): Promise<ListResult> => {
  const offset = (Number(pageNumber) - 1) * Number(limit)

  const where = searchParam
    ? { name: { [Op.iLike]: `%${searchParam}%` } }
    : {}

  const { rows: tenants, count } = await Tenant.findAndCountAll({
    where,
    limit: Number(limit),
    offset,
    order: [["name", "ASC"]]
  })

  const hasMore = count > offset + tenants.length

  return { tenants, count, hasMore }
}

export const findTenantById = async (id: number): Promise<Tenant> => {
  const tenant = await Tenant.findByPk(id, {
    include: [
      { model: User, as: "users", attributes: ["id", "name", "email", "profile", "isOnline"] }
    ]
  })

  if (!tenant) {
    throw new AppError("Tenant not found", 404)
  }

  return tenant
}

export const createTenant = async (data: {
  name: string
  status?: string
  maxUsers?: number
  maxConnections?: number
}): Promise<Tenant> => {
  const existingTenant = await Tenant.findOne({
    where: { name: { [Op.iLike]: data.name } }
  })

  if (existingTenant) {
    throw new AppError("A tenant with this name already exists", 409)
  }

  const tenant = await Tenant.create(data)

  return tenant
}

export const updateTenant = async (id: number, data: {
  name?: string
  status?: string
  maxUsers?: number
  maxConnections?: number
  businessHours?: object
  settings?: object
}): Promise<Tenant> => {
  const tenant = await Tenant.findByPk(id)

  if (!tenant) {
    throw new AppError("Tenant not found", 404)
  }

  if (data.name) {
    const existingTenant = await Tenant.findOne({
      where: {
        name: { [Op.iLike]: data.name },
        id: { [Op.ne]: id }
      }
    })

    if (existingTenant) {
      throw new AppError("A tenant with this name already exists", 409)
    }
  }

  await tenant.update(data)

  return tenant
}

import { Op } from "sequelize"
import { hash } from "bcryptjs"

import User from "../models/User"
import Queue from "../models/Queue"
import UserQueue from "../models/UserQueue"
import { AppError } from "../helpers/AppError"
import { emitToTenant } from "../libs/socket"

interface ListParams {
  tenantId: number
  searchParam?: string
  pageNumber?: string | number
  limit?: string | number
}

interface ListResult {
  users: User[]
  count: number
  hasMore: boolean
}

export const listUsers = async ({ tenantId, searchParam = "", pageNumber = "1", limit = "20" }: ListParams): Promise<ListResult> => {
  const offset = (Number(pageNumber) - 1) * Number(limit)

  const where: Record<string, unknown> = { tenantId }

  if (searchParam) {
    where[Op.or as unknown as string] = [
      { name: { [Op.iLike]: `%${searchParam}%` } },
      { email: { [Op.iLike]: `%${searchParam}%` } }
    ]
  }

  const { rows: users, count } = await User.findAndCountAll({
    where,
    attributes: { exclude: ["passwordHash"] },
    include: [
      { model: UserQueue, as: "userQueues", include: [{ model: Queue, as: "queue" }] }
    ],
    limit: Number(limit),
    offset,
    order: [["name", "ASC"]]
  })

  const hasMore = count > offset + users.length

  return { users, count, hasMore }
}

export const findUserById = async (id: number, tenantId: number): Promise<User> => {
  const user = await User.findOne({
    where: { id, tenantId },
    attributes: { exclude: ["passwordHash"] },
    include: [
      { model: UserQueue, as: "userQueues", include: [{ model: Queue, as: "queue" }] }
    ]
  })

  if (!user) {
    throw new AppError("User not found", 404)
  }

  return user
}

export const createUser = async (tenantId: number, data: {
  name: string
  email: string
  password: string
  profile?: string
  queueIds?: number[]
}): Promise<User> => {
  const existingUser = await User.findOne({
    where: { email: { [Op.iLike]: data.email }, tenantId }
  })

  if (existingUser) {
    throw new AppError("A user with this email already exists", 409)
  }

  const tenant = await (await import("../models/Tenant")).default.findByPk(tenantId)

  if (tenant) {
    const userCount = await User.count({ where: { tenantId } })
    if (userCount >= tenant.maxUsers) {
      throw new AppError("User limit reached for this tenant", 403)
    }
  }

  const passwordHash = await hash(data.password, 10)

  const user = await User.create({
    tenantId,
    name: data.name,
    email: data.email,
    passwordHash,
    profile: data.profile || "user"
  })

  if (data.queueIds && data.queueIds.length > 0) {
    const queueEntries = data.queueIds.map(queueId => ({
      userId: user.id,
      queueId
    }))
    await UserQueue.bulkCreate(queueEntries)
  }

  const createdUser = await findUserById(user.id, tenantId)

  emitToTenant(tenantId, "user:created", createdUser)

  return createdUser
}

export const updateUser = async (id: number, tenantId: number, data: {
  name?: string
  email?: string
  password?: string
  profile?: string
  configs?: object
  queueIds?: number[]
}): Promise<User> => {
  const user = await User.findOne({ where: { id, tenantId } })

  if (!user) {
    throw new AppError("User not found", 404)
  }

  if (data.email) {
    const existingUser = await User.findOne({
      where: {
        email: { [Op.iLike]: data.email },
        tenantId,
        id: { [Op.ne]: id }
      }
    })

    if (existingUser) {
      throw new AppError("A user with this email already exists", 409)
    }
  }

  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.email !== undefined) updateData.email = data.email
  if (data.profile !== undefined) updateData.profile = data.profile
  if (data.configs !== undefined) updateData.configs = data.configs
  if (data.password) updateData.passwordHash = await hash(data.password, 10)

  await user.update(updateData)

  if (data.queueIds !== undefined) {
    await UserQueue.destroy({ where: { userId: id } })
    if (data.queueIds.length > 0) {
      const queueEntries = data.queueIds.map(queueId => ({
        userId: id,
        queueId
      }))
      await UserQueue.bulkCreate(queueEntries)
    }
  }

  const updatedUser = await findUserById(id, tenantId)

  emitToTenant(tenantId, "user:updated", updatedUser)

  return updatedUser
}

export const deleteUser = async (id: number, tenantId: number): Promise<void> => {
  const user = await User.findOne({ where: { id, tenantId } })

  if (!user) {
    throw new AppError("User not found", 404)
  }

  await UserQueue.destroy({ where: { userId: id } })
  await user.destroy()

  emitToTenant(tenantId, "user:deleted", { id })
}

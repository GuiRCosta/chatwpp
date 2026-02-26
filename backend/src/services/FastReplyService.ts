import { Op } from "sequelize"

import FastReply from "../models/FastReply"
import { AppError } from "../helpers/AppError"
import { emitToTenant } from "../libs/socket"

interface ListParams {
  tenantId: number
  userId: number
  searchParam?: string
}

export const listFastReplies = async ({ tenantId, userId, searchParam = "" }: ListParams): Promise<FastReply[]> => {
  const where: Record<string, unknown> = { tenantId, userId }

  if (searchParam) {
    where[Op.or] = [
      { key: { [Op.iLike]: `%${searchParam}%` } },
      { message: { [Op.iLike]: `%${searchParam}%` } }
    ]
  }

  const fastReplies = await FastReply.findAll({
    where,
    order: [["key", "ASC"]]
  })

  return fastReplies
}

export const findFastReplyById = async (id: number, tenantId: number, userId: number): Promise<FastReply> => {
  const fastReply = await FastReply.findOne({
    where: { id, tenantId, userId }
  })

  if (!fastReply) {
    throw new AppError("Fast reply not found", 404)
  }

  return fastReply
}

export const createFastReply = async (tenantId: number, userId: number, data: {
  key: string
  message: string
  mediaUrl?: string
}): Promise<FastReply> => {
  const existingFastReply = await FastReply.findOne({
    where: { key: { [Op.iLike]: data.key }, tenantId, userId }
  })

  if (existingFastReply) {
    throw new AppError("A fast reply with this key already exists", 409)
  }

  const fastReply = await FastReply.create({
    tenantId,
    userId,
    key: data.key,
    message: data.message,
    mediaUrl: data.mediaUrl || ""
  })

  emitToTenant(tenantId, "fastreply:created", fastReply)

  return fastReply
}

export const updateFastReply = async (id: number, tenantId: number, userId: number, data: {
  key?: string
  message?: string
  mediaUrl?: string
}): Promise<FastReply> => {
  const fastReply = await FastReply.findOne({ where: { id, tenantId, userId } })

  if (!fastReply) {
    throw new AppError("Fast reply not found", 404)
  }

  if (data.key) {
    const existingFastReply = await FastReply.findOne({
      where: {
        key: { [Op.iLike]: data.key },
        tenantId,
        userId,
        id: { [Op.ne]: id }
      }
    })

    if (existingFastReply) {
      throw new AppError("A fast reply with this key already exists", 409)
    }
  }

  await fastReply.update(data)

  emitToTenant(tenantId, "fastreply:updated", fastReply)

  return fastReply
}

export const deleteFastReply = async (id: number, tenantId: number, userId: number): Promise<void> => {
  const fastReply = await FastReply.findOne({ where: { id, tenantId, userId } })

  if (!fastReply) {
    throw new AppError("Fast reply not found", 404)
  }

  await fastReply.destroy()

  emitToTenant(tenantId, "fastreply:deleted", { id })
}

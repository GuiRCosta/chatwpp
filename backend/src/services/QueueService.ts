import { Op } from "sequelize"

import Queue from "../models/Queue"
import UserQueue from "../models/UserQueue"
import User from "../models/User"
import { AppError } from "../helpers/AppError"
import { emitToTenant } from "../libs/socket"

interface ListParams {
  tenantId: number
  searchParam?: string
}

export const listQueues = async ({ tenantId, searchParam = "" }: ListParams): Promise<Queue[]> => {
  const where: Record<string, unknown> = { tenantId }

  if (searchParam) {
    where.name = { [Op.iLike]: `%${searchParam}%` }
  }

  const queues = await Queue.findAll({
    where,
    include: [
      { model: UserQueue, as: "userQueues", include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }] }
    ],
    order: [["orderQueue", "ASC"], ["name", "ASC"]]
  })

  return queues
}

export const findQueueById = async (id: number, tenantId: number): Promise<Queue> => {
  const queue = await Queue.findOne({
    where: { id, tenantId },
    include: [
      { model: UserQueue, as: "userQueues", include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }] }
    ]
  })

  if (!queue) {
    throw new AppError("Queue not found", 404)
  }

  return queue
}

export const createQueue = async (tenantId: number, data: {
  name: string
  color: string
  greetingMessage?: string
  outOfHoursMessage?: string
  orderQueue?: number
  userIds?: number[]
}): Promise<Queue> => {
  const existingQueue = await Queue.findOne({
    where: { name: { [Op.iLike]: data.name }, tenantId }
  })

  if (existingQueue) {
    throw new AppError("A queue with this name already exists", 409)
  }

  const queue = await Queue.create({
    tenantId,
    name: data.name,
    color: data.color,
    greetingMessage: data.greetingMessage || "",
    outOfHoursMessage: data.outOfHoursMessage || "",
    orderQueue: data.orderQueue || 0
  })

  if (data.userIds && data.userIds.length > 0) {
    const entries = data.userIds.map(userId => ({
      userId,
      queueId: queue.id
    }))
    await UserQueue.bulkCreate(entries)
  }

  const createdQueue = await findQueueById(queue.id, tenantId)

  emitToTenant(tenantId, "queue:created", createdQueue)

  return createdQueue
}

export const updateQueue = async (id: number, tenantId: number, data: {
  name?: string
  color?: string
  greetingMessage?: string
  outOfHoursMessage?: string
  orderQueue?: number
  isActive?: boolean
  userIds?: number[]
}): Promise<Queue> => {
  const queue = await Queue.findOne({ where: { id, tenantId } })

  if (!queue) {
    throw new AppError("Queue not found", 404)
  }

  if (data.name) {
    const existingQueue = await Queue.findOne({
      where: {
        name: { [Op.iLike]: data.name },
        tenantId,
        id: { [Op.ne]: id }
      }
    })

    if (existingQueue) {
      throw new AppError("A queue with this name already exists", 409)
    }
  }

  const { userIds, ...updateData } = data

  await queue.update(updateData)

  if (userIds !== undefined) {
    await UserQueue.destroy({ where: { queueId: id } })
    if (userIds.length > 0) {
      const entries = userIds.map(userId => ({
        userId,
        queueId: id
      }))
      await UserQueue.bulkCreate(entries)
    }
  }

  const updatedQueue = await findQueueById(id, tenantId)

  emitToTenant(tenantId, "queue:updated", updatedQueue)

  return updatedQueue
}

export const deleteQueue = async (id: number, tenantId: number): Promise<void> => {
  const queue = await Queue.findOne({ where: { id, tenantId } })

  if (!queue) {
    throw new AppError("Queue not found", 404)
  }

  await UserQueue.destroy({ where: { queueId: id } })
  await queue.destroy()

  emitToTenant(tenantId, "queue:deleted", { id })
}

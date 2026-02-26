import { Op } from "sequelize"

import Notification from "../models/Notification"
import { AppError } from "../helpers/AppError"
import { emitToTenant } from "../libs/socket"

interface ListParams {
  tenantId: number
  userId: number
  isRead?: string | boolean
  pageNumber?: string | number
  limit?: string | number
}

interface ListResult {
  notifications: Notification[]
  count: number
  hasMore: boolean
}

export const listNotifications = async ({
  tenantId,
  userId,
  isRead,
  pageNumber = "1",
  limit = "20"
}: ListParams): Promise<ListResult> => {
  const where: Record<string, unknown> = { tenantId, userId }

  if (isRead !== undefined && isRead !== "") {
    where.isRead = String(isRead) === "true"
  }

  const offset = (Number(pageNumber) - 1) * Number(limit)

  const { rows: notifications, count } = await Notification.findAndCountAll({
    where,
    limit: Number(limit),
    offset,
    order: [["createdAt", "DESC"]]
  })

  const hasMore = count > offset + notifications.length

  return { notifications, count, hasMore }
}

export const createNotification = async (tenantId: number, data: {
  userId: number
  title: string
  message: string
}): Promise<Notification> => {
  const notification = await Notification.create({
    tenantId,
    userId: data.userId,
    title: data.title,
    message: data.message,
    isRead: false
  })

  emitToTenant(tenantId, "notification:created", notification)

  return notification
}

export const markAsRead = async (id: number, tenantId: number, userId: number): Promise<Notification> => {
  const notification = await Notification.findOne({
    where: { id, tenantId, userId }
  })

  if (!notification) {
    throw new AppError("Notification not found", 404)
  }

  await notification.update({ isRead: true })

  return notification
}

export const markAllAsRead = async (tenantId: number, userId: number): Promise<number> => {
  const [affectedCount] = await Notification.update(
    { isRead: true },
    { where: { tenantId, userId, isRead: false } }
  )

  return affectedCount
}

export const deleteNotification = async (id: number, tenantId: number, userId: number): Promise<void> => {
  const notification = await Notification.findOne({
    where: { id, tenantId, userId }
  })

  if (!notification) {
    throw new AppError("Notification not found", 404)
  }

  await notification.destroy()
}

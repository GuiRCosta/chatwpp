import { Request, Response } from "express"

import * as NotificationService from "../services/NotificationService"
import { createNotificationSchema } from "../validators/NotificationValidator"

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, userId } = req
  const { isRead, pageNumber, limit } = req.query

  const result = await NotificationService.listNotifications({
    tenantId,
    userId,
    isRead: isRead as string,
    pageNumber: pageNumber as string,
    limit: limit as string
  })

  return res.json({
    success: true,
    data: result
  })
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req

  const validated = await createNotificationSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const notification = await NotificationService.createNotification(tenantId, validated)

  return res.status(201).json({
    success: true,
    data: notification
  })
}

export const markAsRead = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, userId } = req
  const { id } = req.params

  const notification = await NotificationService.markAsRead(Number(id), tenantId, userId)

  return res.json({
    success: true,
    data: notification
  })
}

export const markAllAsRead = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, userId } = req

  const affectedCount = await NotificationService.markAllAsRead(tenantId, userId)

  return res.json({
    success: true,
    data: { message: `${affectedCount} notification(s) marked as read` }
  })
}

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, userId } = req
  const { id } = req.params

  await NotificationService.deleteNotification(Number(id), tenantId, userId)

  return res.json({
    success: true,
    data: { message: "Notification deleted successfully" }
  })
}

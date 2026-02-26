import { Router } from "express"

import * as NotificationController from "../controllers/NotificationController"

const notificationRoutes = Router()

notificationRoutes.get("/", NotificationController.index)
notificationRoutes.post("/", NotificationController.store)
notificationRoutes.put("/:id/read", NotificationController.markAsRead)
notificationRoutes.put("/read-all", NotificationController.markAllAsRead)
notificationRoutes.delete("/:id", NotificationController.remove)

export { notificationRoutes }

import { Router } from "express"

import * as WebhookConfigController from "../controllers/WebhookConfigController"
import { isAdmin } from "../middleware/isAuth"

const webhookConfigRoutes = Router()

webhookConfigRoutes.get("/", isAdmin, WebhookConfigController.index)
webhookConfigRoutes.get("/events", isAdmin, WebhookConfigController.supportedEvents)
webhookConfigRoutes.get("/:id", isAdmin, WebhookConfigController.show)
webhookConfigRoutes.post("/", isAdmin, WebhookConfigController.store)
webhookConfigRoutes.put("/:id", isAdmin, WebhookConfigController.update)
webhookConfigRoutes.delete("/:id", isAdmin, WebhookConfigController.remove)

export { webhookConfigRoutes }

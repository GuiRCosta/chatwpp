import { Router } from "express"

import * as WebhookController from "../controllers/WebhookController"

const webhookRoutes = Router()

webhookRoutes.get("/", WebhookController.verify)
webhookRoutes.post("/", WebhookController.receive)

export { webhookRoutes }

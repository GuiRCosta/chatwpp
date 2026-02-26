import { Router } from "express"

import * as QueueController from "../controllers/QueueController"
import { isAdmin } from "../middleware/isAuth"

const queueRoutes = Router()

queueRoutes.get("/", QueueController.index)
queueRoutes.post("/", isAdmin, QueueController.store)
queueRoutes.put("/:id", isAdmin, QueueController.update)
queueRoutes.delete("/:id", isAdmin, QueueController.remove)

export { queueRoutes }

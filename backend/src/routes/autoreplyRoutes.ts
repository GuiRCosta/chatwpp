import { Router } from "express"

import * as AutoReplyController from "../controllers/AutoReplyController"

const autoreplyRoutes = Router()

autoreplyRoutes.get("/", AutoReplyController.index)
autoreplyRoutes.get("/:id", AutoReplyController.show)
autoreplyRoutes.post("/", AutoReplyController.store)
autoreplyRoutes.put("/:id", AutoReplyController.update)
autoreplyRoutes.delete("/:id", AutoReplyController.remove)

autoreplyRoutes.post("/:id/steps", AutoReplyController.createStep)
autoreplyRoutes.put("/:id/steps/:stepId", AutoReplyController.updateStep)
autoreplyRoutes.delete("/:id/steps/:stepId", AutoReplyController.removeStep)

export { autoreplyRoutes }

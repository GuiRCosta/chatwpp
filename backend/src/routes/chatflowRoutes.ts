import { Router } from "express"

import * as ChatFlowController from "../controllers/ChatFlowController"

const chatflowRoutes = Router()

chatflowRoutes.get("/", ChatFlowController.index)
chatflowRoutes.get("/:id", ChatFlowController.show)
chatflowRoutes.post("/", ChatFlowController.store)
chatflowRoutes.put("/:id", ChatFlowController.update)
chatflowRoutes.delete("/:id", ChatFlowController.remove)
chatflowRoutes.post("/:id/duplicate", ChatFlowController.duplicate)

export { chatflowRoutes }

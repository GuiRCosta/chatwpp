import { Router } from "express"

import * as FastReplyController from "../controllers/FastReplyController"

const fastreplyRoutes = Router()

fastreplyRoutes.get("/", FastReplyController.index)
fastreplyRoutes.post("/", FastReplyController.store)
fastreplyRoutes.put("/:id", FastReplyController.update)
fastreplyRoutes.delete("/:id", FastReplyController.remove)

export { fastreplyRoutes }

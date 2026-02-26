import { Router } from "express"

import * as TagController from "../controllers/TagController"

const tagRoutes = Router()

tagRoutes.get("/", TagController.index)
tagRoutes.post("/", TagController.store)
tagRoutes.put("/:id", TagController.update)
tagRoutes.delete("/:id", TagController.remove)

export { tagRoutes }

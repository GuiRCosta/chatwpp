import { Router } from "express"

import * as ContactController from "../controllers/ContactController"

const contactRoutes = Router()

contactRoutes.get("/", ContactController.index)
contactRoutes.post("/", ContactController.store)
contactRoutes.get("/:id", ContactController.show)
contactRoutes.put("/:id", ContactController.update)
contactRoutes.delete("/:id", ContactController.remove)

export { contactRoutes }

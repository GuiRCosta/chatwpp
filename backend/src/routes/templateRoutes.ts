import { Router } from "express"

import * as TemplateController from "../controllers/TemplateController"

const templateRoutes = Router()

templateRoutes.get("/", TemplateController.index)
templateRoutes.post("/sync", TemplateController.sync)

export { templateRoutes }

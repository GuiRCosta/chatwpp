import { Router } from "express"
import rateLimit from "express-rate-limit"

import * as TemplateController from "../controllers/TemplateController"

const syncLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 2,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many sync requests. Try again later." }
})

const templateRoutes = Router()

templateRoutes.get("/", TemplateController.index)
templateRoutes.post("/sync", syncLimiter, TemplateController.sync)

export { templateRoutes }

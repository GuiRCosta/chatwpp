import { Router } from "express"
import rateLimit from "express-rate-limit"

import * as WhatsAppController from "../controllers/WhatsAppController"
import { isAdmin } from "../middleware/isAuth"

const onboardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many onboard requests. Try again later." }
})

const whatsappRoutes = Router()

whatsappRoutes.get("/", WhatsAppController.index)
whatsappRoutes.post("/", isAdmin, WhatsAppController.store)
whatsappRoutes.post("/onboard", isAdmin, onboardLimiter, WhatsAppController.onboard)
whatsappRoutes.put("/:id", isAdmin, WhatsAppController.update)
whatsappRoutes.delete("/:id", isAdmin, WhatsAppController.remove)

export { whatsappRoutes }

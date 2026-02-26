import { Router } from "express"

import * as WhatsAppController from "../controllers/WhatsAppController"
import { isAdmin } from "../middleware/isAuth"

const whatsappRoutes = Router()

whatsappRoutes.get("/", WhatsAppController.index)
whatsappRoutes.post("/", isAdmin, WhatsAppController.store)
whatsappRoutes.post("/onboard", isAdmin, WhatsAppController.onboard)
whatsappRoutes.put("/:id", isAdmin, WhatsAppController.update)
whatsappRoutes.delete("/:id", isAdmin, WhatsAppController.remove)

export { whatsappRoutes }

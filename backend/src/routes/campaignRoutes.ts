import { Router } from "express"
import rateLimit from "express-rate-limit"

import * as CampaignController from "../controllers/CampaignController"

const startLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many campaign start requests. Try again later." }
})

const campaignRoutes = Router()

campaignRoutes.get("/", CampaignController.index)
campaignRoutes.post("/", CampaignController.store)
campaignRoutes.get("/:id", CampaignController.show)
campaignRoutes.put("/:id", CampaignController.update)
campaignRoutes.post("/:id/start", startLimiter, CampaignController.start)
campaignRoutes.post("/:id/cancel", CampaignController.cancel)
campaignRoutes.post("/:id/contacts", CampaignController.addContacts)
campaignRoutes.delete("/:id", CampaignController.destroy)
campaignRoutes.delete("/:id/contacts/:contactId", CampaignController.removeContact)

export { campaignRoutes }

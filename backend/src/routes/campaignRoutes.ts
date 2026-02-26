import { Router } from "express"

import * as CampaignController from "../controllers/CampaignController"

const campaignRoutes = Router()

campaignRoutes.get("/", CampaignController.index)
campaignRoutes.post("/", CampaignController.store)
campaignRoutes.get("/:id", CampaignController.show)
campaignRoutes.put("/:id", CampaignController.update)
campaignRoutes.post("/:id/start", CampaignController.start)
campaignRoutes.post("/:id/cancel", CampaignController.cancel)
campaignRoutes.post("/:id/contacts", CampaignController.addContacts)
campaignRoutes.delete("/:id/contacts/:contactId", CampaignController.removeContact)

export { campaignRoutes }

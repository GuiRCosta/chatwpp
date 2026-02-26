import { Router } from "express"

import * as OpportunityController from "../controllers/OpportunityController"

const opportunityRoutes = Router()

opportunityRoutes.get("/", OpportunityController.index)
opportunityRoutes.post("/", OpportunityController.store)
opportunityRoutes.get("/:id", OpportunityController.show)
opportunityRoutes.put("/:id", OpportunityController.update)
opportunityRoutes.put("/:id/move", OpportunityController.move)
opportunityRoutes.delete("/:id", OpportunityController.remove)

export { opportunityRoutes }

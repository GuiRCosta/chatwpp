import { Router } from "express"
import * as AutomationRuleController from "../controllers/AutomationRuleController"

const automationRuleRoutes = Router()

automationRuleRoutes.get("/", AutomationRuleController.index)
automationRuleRoutes.get("/:id", AutomationRuleController.show)
automationRuleRoutes.post("/", AutomationRuleController.store)
automationRuleRoutes.put("/:id", AutomationRuleController.update)
automationRuleRoutes.delete("/:id", AutomationRuleController.remove)

export { automationRuleRoutes }

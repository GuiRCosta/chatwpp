import { Router } from "express"

import * as TenantController from "../controllers/TenantController"
import { isSuperAdmin } from "../middleware/isAuth"

const tenantRoutes = Router()

tenantRoutes.get("/", isSuperAdmin, TenantController.index)
tenantRoutes.post("/", isSuperAdmin, TenantController.store)
tenantRoutes.get("/:id", isSuperAdmin, TenantController.show)
tenantRoutes.put("/:id", isSuperAdmin, TenantController.update)

export { tenantRoutes }

import { Router } from "express"

import * as SettingController from "../controllers/SettingController"
import { isAdmin } from "../middleware/isAuth"

const settingRoutes = Router()

settingRoutes.get("/", SettingController.index)
settingRoutes.put("/", isAdmin, SettingController.update)
settingRoutes.put("/bulk", isAdmin, SettingController.updateBulk)

export { settingRoutes }

import { Router } from "express"

import * as AuthController from "../controllers/AuthController"
import { isAuth } from "../middleware/isAuth"

const authRoutes = Router()

authRoutes.post("/login", AuthController.login)
authRoutes.post("/refresh", AuthController.refresh)
authRoutes.post("/logout", isAuth, AuthController.logout)

export { authRoutes }

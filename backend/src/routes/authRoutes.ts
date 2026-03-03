import { Router } from "express"
import rateLimit from "express-rate-limit"

import * as AuthController from "../controllers/AuthController"
import { isAuth } from "../middleware/isAuth"

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many login attempts. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false
})

const authRoutes = Router()

authRoutes.post("/login", loginLimiter, AuthController.login)
authRoutes.post("/refresh", AuthController.refresh)
authRoutes.post("/logout", isAuth, AuthController.logout)

export { authRoutes }

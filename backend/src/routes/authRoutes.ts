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

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: "Too many reset requests. Try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false
})

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many reset attempts. Try again later." },
  standardHeaders: true,
  legacyHeaders: false
})

const authRoutes = Router()

authRoutes.post("/login", loginLimiter, AuthController.login)
authRoutes.post("/refresh", AuthController.refresh)
authRoutes.get("/me", isAuth, AuthController.me)
authRoutes.post("/logout", isAuth, AuthController.logout)
authRoutes.put("/change-password", isAuth, loginLimiter, AuthController.changePassword)
authRoutes.post("/forgot-password", forgotPasswordLimiter, AuthController.forgotPassword)
authRoutes.post("/reset-password", resetPasswordLimiter, AuthController.resetPassword)

export { authRoutes }

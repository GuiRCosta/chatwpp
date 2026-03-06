import { Request, Response, CookieOptions } from "express"

import * as AuthService from "../services/AuthService"
import User from "../models/User"
import { AppError } from "../helpers/AppError"
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema
} from "../validators/AuthValidator"

const REFRESH_COOKIE_NAME = "nuvio_refresh"
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/auth/refresh"
}

export const login = async (req: Request, res: Response): Promise<Response> => {
  const validated = await loginSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const result = await AuthService.login(validated)

  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
    ...refreshCookieOptions,
    maxAge: REFRESH_MAX_AGE_MS
  })

  return res.json({
    success: true,
    data: {
      token: result.token,
      user: result.user
    }
  })
}

export const refresh = async (req: Request, res: Response): Promise<Response> => {
  const refreshToken =
    req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken

  if (!refreshToken) {
    throw new AppError("Refresh token not provided", 401)
  }

  const tokens = await AuthService.refreshTokens(refreshToken)

  res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
    ...refreshCookieOptions,
    maxAge: REFRESH_MAX_AGE_MS
  })

  return res.json({
    success: true,
    data: { token: tokens.token }
  })
}

export const logout = async (req: Request, res: Response): Promise<Response> => {
  await AuthService.logout(req.userId)

  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions)

  return res.json({
    success: true,
    data: { message: "Logged out successfully" }
  })
}

export const me = async (req: Request, res: Response): Promise<Response> => {
  const user = await User.findByPk(req.userId, {
    attributes: ["id", "tenantId", "name", "email", "profile"]
  })

  if (!user) {
    throw new AppError("User not found", 404)
  }

  return res.json({
    success: true,
    data: { user }
  })
}

export const forgotPassword = async (req: Request, res: Response): Promise<Response> => {
  const { email } = await forgotPasswordSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  await AuthService.forgotPassword(email)

  return res.json({
    success: true,
    data: { message: "If this email exists, a reset link has been sent" }
  })
}

export const resetPassword = async (req: Request, res: Response): Promise<Response> => {
  const { token, password } = await resetPasswordSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  await AuthService.resetPassword(token, password)

  return res.json({
    success: true,
    data: { message: "Password reset successfully" }
  })
}

export const changePassword = async (req: Request, res: Response): Promise<Response> => {
  const { currentPassword, newPassword } = await changePasswordSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  await AuthService.changePassword(req.userId, currentPassword, newPassword)

  return res.json({
    success: true,
    data: { message: "Password changed successfully" }
  })
}

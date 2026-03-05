import { Request, Response } from "express"

import * as AuthService from "../services/AuthService"
import {
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from "../validators/AuthValidator"

export const login = async (req: Request, res: Response): Promise<Response> => {
  const validated = await loginSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const result = await AuthService.login(validated)

  return res.json({
    success: true,
    data: result
  })
}

export const refresh = async (req: Request, res: Response): Promise<Response> => {
  const { refreshToken } = await refreshSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const tokens = await AuthService.refreshTokens(refreshToken)

  return res.json({
    success: true,
    data: tokens
  })
}

export const logout = async (req: Request, res: Response): Promise<Response> => {
  await AuthService.logout(req.userId)

  return res.json({
    success: true,
    data: { message: "Logged out successfully" }
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

import { Request, Response } from "express"

import * as AuthService from "../services/AuthService"
import { loginSchema, refreshSchema } from "../validators/AuthValidator"
import { AppError } from "../helpers/AppError"

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

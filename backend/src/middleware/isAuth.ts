import { Request, Response, NextFunction } from "express"
import { verify } from "jsonwebtoken"
import authConfig from "../config/auth"
import { AppError } from "../helpers/AppError"
import User from "../models/User"

interface TokenPayload {
  id: number
  tenantId: number
  profile: string
  tokenVersion: number
  iat: number
  exp: number
}

declare global {
  namespace Express {
    interface Request {
      userId: number
      tenantId: number
      userProfile: string
    }
  }
}

export async function isAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    throw new AppError("Token not provided", 401)
  }

  const [scheme, token] = authHeader.split(" ")

  if (!token || scheme !== "Bearer") {
    throw new AppError("Token malformatted", 401)
  }

  try {
    const decoded = verify(token, authConfig.secret) as TokenPayload

    const user = await User.findByPk(decoded.id, {
      attributes: ["id", "tokenVersion"]
    })

    if (!user || user.tokenVersion !== decoded.tokenVersion) {
      throw new AppError("Token revoked", 401)
    }

    req.userId = decoded.id
    req.tenantId = decoded.tenantId
    req.userProfile = decoded.profile

    return next()
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    throw new AppError("Invalid or expired token", 401)
  }
}

export function isAdmin(req: Request, _res: Response, next: NextFunction): void {
  const allowedProfiles = ["admin", "superadmin"]

  if (!allowedProfiles.includes(req.userProfile)) {
    throw new AppError("Access denied. Admin privileges required.", 403)
  }

  return next()
}

export function isSuperAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.userProfile !== "superadmin") {
    throw new AppError("Access denied. Super admin privileges required.", 403)
  }

  return next()
}

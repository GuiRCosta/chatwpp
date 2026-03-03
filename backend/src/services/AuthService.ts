import { sign, verify } from "jsonwebtoken"
import { compare, hash } from "bcryptjs"
import { Op } from "sequelize"

import User from "../models/User"
import authConfig from "../config/auth"
import { AppError } from "../helpers/AppError"

interface LoginPayload {
  email: string
  password: string
}

interface TokenResponse {
  token: string
  refreshToken: string
  user: {
    id: number
    tenantId: number
    name: string
    email: string
    profile: string
  }
}

interface TokenPayload {
  id: number
  tenantId: number
  profile: string
  tokenVersion: number
}

const createTokens = (payload: { id: number; tenantId: number; profile: string; tokenVersion: number }): { token: string; refreshToken: string } => {
  const token = sign(payload, authConfig.secret, {
    expiresIn: authConfig.expiresIn
  } as Parameters<typeof sign>[2])

  const refreshToken = sign(payload, authConfig.refreshSecret, {
    expiresIn: authConfig.refreshExpiresIn
  } as Parameters<typeof sign>[2])

  return { token, refreshToken }
}

export const hashPassword = async (password: string): Promise<string> => {
  return hash(password, 10)
}

const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 30 * 60 * 1000 // 30 minutes

export const login = async ({ email, password }: LoginPayload): Promise<TokenResponse> => {
  const user = await User.findOne({
    where: { email: { [Op.iLike]: email } }
  })

  if (!user) {
    throw new AppError("Invalid email or password", 401)
  }

  // Check if account is locked
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const remainingMinutes = Math.ceil(
      (new Date(user.lockedUntil).getTime() - Date.now()) / 60000
    )
    throw new AppError(
      `Account locked. Try again in ${remainingMinutes} minute(s).`,
      423
    )
  }

  const isValidPassword = await compare(password, user.passwordHash)

  if (!isValidPassword) {
    const attempts = user.loginAttempts + 1
    const updateData: Record<string, unknown> = { loginAttempts: attempts }

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS)
      updateData.loginAttempts = 0
      await user.update(updateData)
      throw new AppError(
        "Too many failed attempts. Account locked for 30 minutes.",
        423
      )
    }

    await user.update(updateData)
    throw new AppError("Invalid email or password", 401)
  }

  // Reset login attempts on successful login
  const tokenPayload = {
    id: user.id,
    tenantId: user.tenantId,
    profile: user.profile,
    tokenVersion: user.tokenVersion
  }

  const { token, refreshToken } = createTokens(tokenPayload)

  await user.update({
    lastLogin: new Date(),
    isOnline: true,
    loginAttempts: 0,
    lockedUntil: null
  })

  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      profile: user.profile
    }
  }
}

export const refreshTokens = async (oldRefreshToken: string): Promise<{ token: string; refreshToken: string }> => {
  try {
    const decoded = verify(oldRefreshToken, authConfig.refreshSecret) as TokenPayload

    const user = await User.findByPk(decoded.id)

    if (!user) {
      throw new AppError("User not found", 401)
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      throw new AppError("Token revoked", 401)
    }

    const tokenPayload = {
      id: user.id,
      tenantId: user.tenantId,
      profile: user.profile,
      tokenVersion: user.tokenVersion
    }

    return createTokens(tokenPayload)
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    throw new AppError("Invalid or expired refresh token", 401)
  }
}

export const logout = async (userId: number): Promise<void> => {
  const user = await User.findByPk(userId)

  if (user) {
    await user.update({
      isOnline: false,
      tokenVersion: user.tokenVersion + 1
    })
  }
}

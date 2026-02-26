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

const createTokens = (payload: { id: number; tenantId: number; profile: string }): { token: string; refreshToken: string } => {
  const token = sign(payload, authConfig.secret, {
    expiresIn: authConfig.expiresIn
  })

  const refreshToken = sign(payload, authConfig.refreshSecret, {
    expiresIn: authConfig.refreshExpiresIn
  })

  return { token, refreshToken }
}

export const hashPassword = async (password: string): Promise<string> => {
  return hash(password, 10)
}

export const login = async ({ email, password }: LoginPayload): Promise<TokenResponse> => {
  const user = await User.findOne({
    where: { email: { [Op.iLike]: email } }
  })

  if (!user) {
    throw new AppError("Invalid email or password", 401)
  }

  const isValidPassword = await compare(password, user.passwordHash)

  if (!isValidPassword) {
    throw new AppError("Invalid email or password", 401)
  }

  const tokenPayload = {
    id: user.id,
    tenantId: user.tenantId,
    profile: user.profile
  }

  const { token, refreshToken } = createTokens(tokenPayload)

  await user.update({ lastLogin: new Date(), isOnline: true })

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

    const tokenPayload = {
      id: user.id,
      tenantId: user.tenantId,
      profile: user.profile
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

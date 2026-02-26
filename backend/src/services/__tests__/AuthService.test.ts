import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/models/User", () => ({
  default: {
    findOne: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  }
}))

vi.mock("bcryptjs", () => ({
  compare: vi.fn(),
  hash: vi.fn()
}))

vi.mock("jsonwebtoken", () => ({
  sign: vi.fn().mockReturnValue("mock-token"),
  verify: vi.fn()
}))

vi.mock("@/config/auth", () => ({
  default: {
    secret: "test-secret",
    refreshSecret: "test-refresh-secret",
    expiresIn: "15m",
    refreshExpiresIn: "7d"
  }
}))

import { login, hashPassword, refreshTokens, logout } from "../AuthService"
import User from "@/models/User"
import { compare, hash } from "bcryptjs"
import { verify } from "jsonwebtoken"
import { buildUser } from "@/__tests__/factories"
import { AppError } from "@/helpers/AppError"

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("login", () => {
    it("returns token and user data on successful login", async () => {
      const mockUser = buildUser({ email: "admin@test.com", name: "Admin" })
      vi.mocked(User.findOne).mockResolvedValue(mockUser as unknown as User)
      vi.mocked(compare).mockResolvedValue(true as never)

      const result = await login({ email: "admin@test.com", password: "123456" })

      expect(result).toHaveProperty("token")
      expect(result).toHaveProperty("refreshToken")
      expect(result.user).toMatchObject({
        id: 1,
        tenantId: 1,
        name: "Admin",
        email: "admin@test.com",
        profile: "admin"
      })
      expect(User.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.anything() })
      )
      expect(mockUser.update).toHaveBeenCalledWith(
        expect.objectContaining({ isOnline: true })
      )
    })

    it("throws error when user is not found (wrong email)", async () => {
      vi.mocked(User.findOne).mockResolvedValue(null)

      await expect(
        login({ email: "nonexistent@test.com", password: "123456" })
      ).rejects.toThrow(AppError)

      await expect(
        login({ email: "nonexistent@test.com", password: "123456" })
      ).rejects.toThrow("Invalid email or password")
    })

    it("throws error when password is wrong", async () => {
      const mockUser = buildUser()
      vi.mocked(User.findOne).mockResolvedValue(mockUser as unknown as User)
      vi.mocked(compare).mockResolvedValue(false as never)

      await expect(
        login({ email: "test@example.com", password: "wrongpassword" })
      ).rejects.toThrow("Invalid email or password")
    })
  })

  describe("hashPassword", () => {
    it("returns a hashed password", async () => {
      vi.mocked(hash).mockResolvedValue("hashed-password-value" as never)

      const result = await hashPassword("mypassword")

      expect(result).toBe("hashed-password-value")
      expect(hash).toHaveBeenCalledWith("mypassword", 10)
    })
  })

  describe("refreshTokens", () => {
    it("returns new tokens for a valid refresh token", async () => {
      vi.mocked(verify).mockReturnValue({
        id: 1,
        tenantId: 1,
        profile: "admin",
        tokenVersion: 0
      } as never)

      const mockUser = buildUser()
      vi.mocked(User.findByPk).mockResolvedValue(mockUser as unknown as User)

      const result = await refreshTokens("valid-refresh-token")

      expect(result).toHaveProperty("token")
      expect(result).toHaveProperty("refreshToken")
      expect(User.findByPk).toHaveBeenCalledWith(1)
    })

    it("throws error when user is not found after decoding token", async () => {
      vi.mocked(verify).mockReturnValue({
        id: 999,
        tenantId: 1,
        profile: "admin",
        tokenVersion: 0
      } as never)
      vi.mocked(User.findByPk).mockResolvedValue(null)

      await expect(refreshTokens("valid-token")).rejects.toThrow(
        "User not found"
      )
    })

    it("throws error when refresh token is invalid", async () => {
      vi.mocked(verify).mockImplementation(() => {
        throw new Error("jwt malformed")
      })

      await expect(refreshTokens("invalid-token")).rejects.toThrow(
        "Invalid or expired refresh token"
      )
    })
  })

  describe("logout", () => {
    it("sets user offline and increments tokenVersion", async () => {
      const mockUser = buildUser({ tokenVersion: 3 })
      vi.mocked(User.findByPk).mockResolvedValue(mockUser as unknown as User)

      await logout(1)

      expect(User.findByPk).toHaveBeenCalledWith(1)
      expect(mockUser.update).toHaveBeenCalledWith({
        isOnline: false,
        tokenVersion: 4
      })
    })

    it("does nothing when user is not found", async () => {
      vi.mocked(User.findByPk).mockResolvedValue(null)

      await expect(logout(999)).resolves.toBeUndefined()
    })
  })
})

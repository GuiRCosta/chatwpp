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

vi.mock("@/helpers/sendEmail", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined)
}))

import {
  login,
  hashPassword,
  refreshTokens,
  logout,
  forgotPassword,
  resetPassword,
  changePassword
} from "../AuthService"
import User from "@/models/User"
import { compare, hash } from "bcryptjs"
import { verify } from "jsonwebtoken"
import { buildUser } from "@/__tests__/factories"
import { AppError } from "@/helpers/AppError"
import { sendPasswordResetEmail } from "@/helpers/sendEmail"
import { createHash } from "crypto"

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

  describe("forgotPassword", () => {
    it("sends reset email when user exists", async () => {
      const mockUser = buildUser({ email: "user@test.com", name: "João" })
      vi.mocked(User.findOne).mockResolvedValue(mockUser as unknown as User)

      await forgotPassword("user@test.com")

      expect(User.findOne).toHaveBeenCalled()
      expect(mockUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordResetToken: expect.any(String),
          passwordResetExpires: expect.any(Date)
        })
      )
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        "user@test.com",
        expect.any(String),
        "João"
      )
    })

    it("stores hashed token (not raw) in database", async () => {
      const mockUser = buildUser({ email: "user@test.com", name: "João" })
      vi.mocked(User.findOne).mockResolvedValue(mockUser as unknown as User)

      await forgotPassword("user@test.com")

      const updateCall = mockUser.update.mock.calls[0][0] as Record<string, unknown>
      const storedToken = updateCall.passwordResetToken as string

      const emailCall = vi.mocked(sendPasswordResetEmail).mock.calls[0]
      const rawToken = emailCall[1]

      // Stored token should be a SHA-256 hash of the raw token
      const expectedHash = createHash("sha256").update(rawToken).digest("hex")
      expect(storedToken).toBe(expectedHash)

      // Stored token should NOT equal the raw token
      expect(storedToken).not.toBe(rawToken)
    })

    it("does not throw when user does not exist (prevents email enumeration)", async () => {
      vi.mocked(User.findOne).mockResolvedValue(null)

      await expect(forgotPassword("nobody@test.com")).resolves.toBeUndefined()

      expect(sendPasswordResetEmail).not.toHaveBeenCalled()
    })

    it("sets token expiry to 1 hour from now", async () => {
      const mockUser = buildUser({ email: "user@test.com" })
      vi.mocked(User.findOne).mockResolvedValue(mockUser as unknown as User)

      const before = Date.now()
      await forgotPassword("user@test.com")
      const after = Date.now()

      const updateCall = mockUser.update.mock.calls[0][0] as Record<string, unknown>
      const expires = updateCall.passwordResetExpires as Date
      const expiresMs = expires.getTime()
      const oneHourMs = 60 * 60 * 1000

      expect(expiresMs).toBeGreaterThanOrEqual(before + oneHourMs - 100)
      expect(expiresMs).toBeLessThanOrEqual(after + oneHourMs + 100)
    })
  })

  describe("resetPassword", () => {
    it("resets password with valid token", async () => {
      const mockUser = buildUser({
        passwordResetExpires: new Date(Date.now() + 3600000)
      })
      vi.mocked(User.findOne).mockResolvedValue(mockUser as unknown as User)
      vi.mocked(hash).mockResolvedValue("new-hashed-password" as never)

      await resetPassword("some-valid-token", "newpassword123")

      expect(hash).toHaveBeenCalledWith("newpassword123", 10)
      expect(mockUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordHash: "new-hashed-password",
          passwordResetToken: null,
          passwordResetExpires: null,
          tokenVersion: 1
        })
      )
    })

    it("queries with hashed token", async () => {
      vi.mocked(User.findOne).mockResolvedValue(null)

      const rawToken = "my-raw-token"
      const expectedHash = createHash("sha256").update(rawToken).digest("hex")

      try {
        await resetPassword(rawToken, "newpassword123")
      } catch {
        // expected to throw
      }

      expect(User.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            passwordResetToken: expectedHash
          })
        })
      )
    })

    it("throws error when token is invalid or expired", async () => {
      vi.mocked(User.findOne).mockResolvedValue(null)

      await expect(
        resetPassword("invalid-token", "newpassword123")
      ).rejects.toThrow("Invalid or expired reset token")
    })

    it("increments tokenVersion to revoke existing sessions", async () => {
      const mockUser = buildUser({
        passwordResetExpires: new Date(Date.now() + 3600000),
        tokenVersion: 5
      })
      vi.mocked(User.findOne).mockResolvedValue(mockUser as unknown as User)
      vi.mocked(hash).mockResolvedValue("hashed" as never)

      await resetPassword("some-token", "newpassword123")

      expect(mockUser.update).toHaveBeenCalledWith(
        expect.objectContaining({ tokenVersion: 6 })
      )
    })
  })

  describe("changePassword", () => {
    it("changes password when current password is correct", async () => {
      const mockUser = buildUser({ tokenVersion: 2 })
      vi.mocked(User.findByPk).mockResolvedValue(mockUser as unknown as User)
      vi.mocked(compare).mockResolvedValue(true as never)
      vi.mocked(hash).mockResolvedValue("new-hashed-pw" as never)

      await changePassword(1, "oldpass123", "newpass456")

      expect(compare).toHaveBeenCalledWith("oldpass123", mockUser.passwordHash)
      expect(hash).toHaveBeenCalledWith("newpass456", 10)
      expect(mockUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordHash: "new-hashed-pw",
          tokenVersion: 3
        })
      )
    })

    it("throws when current password is incorrect", async () => {
      const mockUser = buildUser()
      vi.mocked(User.findByPk).mockResolvedValue(mockUser as unknown as User)
      vi.mocked(compare).mockResolvedValue(false as never)

      await expect(
        changePassword(1, "wrongpass", "newpass456")
      ).rejects.toThrow("Current password is incorrect")

      expect(mockUser.update).not.toHaveBeenCalled()
    })

    it("throws when user not found", async () => {
      vi.mocked(User.findByPk).mockResolvedValue(null)

      await expect(
        changePassword(999, "oldpass", "newpass456")
      ).rejects.toThrow("User not found")
    })

    it("increments tokenVersion to invalidate other sessions", async () => {
      const mockUser = buildUser({ tokenVersion: 7 })
      vi.mocked(User.findByPk).mockResolvedValue(mockUser as unknown as User)
      vi.mocked(compare).mockResolvedValue(true as never)
      vi.mocked(hash).mockResolvedValue("hashed" as never)

      await changePassword(1, "oldpass", "newpass456")

      expect(mockUser.update).toHaveBeenCalledWith(
        expect.objectContaining({ tokenVersion: 8 })
      )
    })
  })
})

import { describe, it, expect } from "vitest"
import {
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from "../AuthValidator"

describe("loginSchema", () => {
  it("validates a correct payload", async () => {
    const result = await loginSchema.validate({
      email: "user@example.com",
      password: "password123"
    })
    expect(result.email).toBe("user@example.com")
    expect(result.password).toBe("password123")
  })

  it("rejects missing email", async () => {
    await expect(
      loginSchema.validate({ password: "password123" })
    ).rejects.toThrow("Email is required")
  })

  it("rejects missing password", async () => {
    await expect(
      loginSchema.validate({ email: "user@example.com" })
    ).rejects.toThrow("Password is required")
  })

  it("rejects invalid email format", async () => {
    await expect(
      loginSchema.validate({ email: "not-an-email", password: "password123" })
    ).rejects.toThrow("Invalid email")
  })

  it("rejects password shorter than 8 characters", async () => {
    await expect(
      loginSchema.validate({ email: "user@example.com", password: "1234567" })
    ).rejects.toThrow("Password must be at least 8 characters")
  })

  it("accepts password with exactly 8 characters", async () => {
    const result = await loginSchema.validate({
      email: "user@example.com",
      password: "12345678"
    })
    expect(result.password).toBe("12345678")
  })
})

describe("refreshSchema", () => {
  it("validates a correct payload", async () => {
    const result = await refreshSchema.validate({
      refreshToken: "some-refresh-token"
    })
    expect(result.refreshToken).toBe("some-refresh-token")
  })

  it("rejects missing refreshToken", async () => {
    await expect(refreshSchema.validate({})).rejects.toThrow(
      "Refresh token is required"
    )
  })
})

describe("forgotPasswordSchema", () => {
  it("validates a correct email", async () => {
    const result = await forgotPasswordSchema.validate({
      email: "user@example.com"
    })
    expect(result.email).toBe("user@example.com")
  })

  it("rejects invalid email", async () => {
    await expect(
      forgotPasswordSchema.validate({ email: "not-an-email" })
    ).rejects.toThrow("Invalid email")
  })

  it("rejects missing email", async () => {
    await expect(forgotPasswordSchema.validate({})).rejects.toThrow(
      "Email is required"
    )
  })

  it("strips unknown fields", async () => {
    const result = await forgotPasswordSchema.validate(
      { email: "user@example.com", extra: "field" },
      { stripUnknown: true }
    )
    expect(result).not.toHaveProperty("extra")
  })
})

describe("resetPasswordSchema", () => {
  it("validates correct reset data", async () => {
    const result = await resetPasswordSchema.validate({
      token: "abc123",
      password: "newpassword123"
    })
    expect(result.token).toBe("abc123")
    expect(result.password).toBe("newpassword123")
  })

  it("rejects missing token", async () => {
    await expect(
      resetPasswordSchema.validate({ password: "newpassword123" })
    ).rejects.toThrow("Token is required")
  })

  it("rejects missing password", async () => {
    await expect(
      resetPasswordSchema.validate({ token: "abc123" })
    ).rejects.toThrow("Password is required")
  })

  it("rejects short password", async () => {
    await expect(
      resetPasswordSchema.validate({ token: "abc123", password: "short" })
    ).rejects.toThrow("Password must be at least 8 characters")
  })

  it("strips unknown fields", async () => {
    const result = await resetPasswordSchema.validate(
      { token: "abc123", password: "newpassword123", extra: "field" },
      { stripUnknown: true }
    )
    expect(result).not.toHaveProperty("extra")
  })
})

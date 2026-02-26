import { describe, it, expect } from "vitest"
import { loginSchema, refreshSchema } from "../AuthValidator"

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

  it("rejects password shorter than 6 characters", async () => {
    await expect(
      loginSchema.validate({ email: "user@example.com", password: "12345" })
    ).rejects.toThrow("Password must be at least 6 characters")
  })

  it("accepts password with exactly 6 characters", async () => {
    const result = await loginSchema.validate({
      email: "user@example.com",
      password: "123456"
    })
    expect(result.password).toBe("123456")
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

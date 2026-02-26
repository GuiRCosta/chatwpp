import { describe, it, expect } from "vitest"
import { createUserSchema, updateUserSchema } from "../UserValidator"

describe("createUserSchema", () => {
  it("validates a correct payload with all fields", async () => {
    const result = await createUserSchema.validate({
      name: "John Doe",
      email: "john@example.com",
      password: "secret123",
      profile: "admin"
    })
    expect(result.name).toBe("John Doe")
    expect(result.email).toBe("john@example.com")
    expect(result.password).toBe("secret123")
    expect(result.profile).toBe("admin")
  })

  it("applies default profile as 'user' when omitted", async () => {
    const result = await createUserSchema.validate({
      name: "John Doe",
      email: "john@example.com",
      password: "secret123"
    })
    expect(result.profile).toBe("user")
  })

  it("rejects missing name", async () => {
    await expect(
      createUserSchema.validate({
        email: "john@example.com",
        password: "secret123"
      })
    ).rejects.toThrow("Name is required")
  })

  it("rejects name shorter than 2 characters", async () => {
    await expect(
      createUserSchema.validate({
        name: "J",
        email: "john@example.com",
        password: "secret123"
      })
    ).rejects.toThrow()
  })

  it("rejects name longer than 100 characters", async () => {
    await expect(
      createUserSchema.validate({
        name: "A".repeat(101),
        email: "john@example.com",
        password: "secret123"
      })
    ).rejects.toThrow()
  })

  it("rejects missing email", async () => {
    await expect(
      createUserSchema.validate({
        name: "John Doe",
        password: "secret123"
      })
    ).rejects.toThrow("Email is required")
  })

  it("rejects invalid email", async () => {
    await expect(
      createUserSchema.validate({
        name: "John Doe",
        email: "not-email",
        password: "secret123"
      })
    ).rejects.toThrow("Invalid email")
  })

  it("rejects missing password", async () => {
    await expect(
      createUserSchema.validate({
        name: "John Doe",
        email: "john@example.com"
      })
    ).rejects.toThrow("Password is required")
  })

  it("rejects password shorter than 6 characters", async () => {
    await expect(
      createUserSchema.validate({
        name: "John Doe",
        email: "john@example.com",
        password: "12345"
      })
    ).rejects.toThrow("Password must be at least 6 characters")
  })

  it("rejects invalid profile value", async () => {
    await expect(
      createUserSchema.validate({
        name: "John Doe",
        email: "john@example.com",
        password: "secret123",
        profile: "invalid"
      })
    ).rejects.toThrow()
  })

  it("accepts all valid profile values", async () => {
    const profiles = ["superadmin", "admin", "super", "user"]
    for (const profile of profiles) {
      const result = await createUserSchema.validate({
        name: "John Doe",
        email: "john@example.com",
        password: "secret123",
        profile
      })
      expect(result.profile).toBe(profile)
    }
  })
})

describe("updateUserSchema", () => {
  it("validates a payload with all optional fields", async () => {
    const result = await updateUserSchema.validate({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "newpass123",
      profile: "admin",
      configs: { theme: "dark" }
    })
    expect(result.name).toBe("Jane Doe")
    expect(result.email).toBe("jane@example.com")
    expect(result.configs).toEqual({ theme: "dark" })
  })

  it("validates an empty payload (all fields optional)", async () => {
    const result = await updateUserSchema.validate({})
    expect(result).toBeDefined()
  })

  it("rejects invalid email if provided", async () => {
    await expect(
      updateUserSchema.validate({ email: "bad-email" })
    ).rejects.toThrow("Invalid email")
  })

  it("rejects password shorter than 6 characters if provided", async () => {
    await expect(
      updateUserSchema.validate({ password: "123" })
    ).rejects.toThrow("Password must be at least 6 characters")
  })

  it("accepts null configs", async () => {
    const result = await updateUserSchema.validate({ configs: null })
    expect(result.configs).toBeNull()
  })

  it("rejects invalid profile if provided", async () => {
    await expect(
      updateUserSchema.validate({ profile: "unknown" })
    ).rejects.toThrow()
  })
})

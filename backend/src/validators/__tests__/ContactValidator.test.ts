import { describe, it, expect } from "vitest"
import { createContactSchema, updateContactSchema } from "../ContactValidator"

describe("createContactSchema", () => {
  it("validates a correct payload with required fields", async () => {
    const result = await createContactSchema.validate({
      name: "Alice",
      number: "5511999999999"
    })
    expect(result.name).toBe("Alice")
    expect(result.number).toBe("5511999999999")
    expect(result.isGroup).toBe(false)
  })

  it("validates a full payload with all optional fields", async () => {
    const result = await createContactSchema.validate({
      name: "Alice",
      number: "5511999999999",
      email: "alice@example.com",
      isGroup: true,
      customFields: { company: "Acme" }
    })
    expect(result.email).toBe("alice@example.com")
    expect(result.isGroup).toBe(true)
    expect(result.customFields).toEqual({ company: "Acme" })
  })

  it("rejects missing name", async () => {
    await expect(
      createContactSchema.validate({ number: "5511999999999" })
    ).rejects.toThrow("Name is required")
  })

  it("rejects missing number", async () => {
    await expect(
      createContactSchema.validate({ name: "Alice" })
    ).rejects.toThrow("Number is required")
  })

  it("rejects name longer than 200 characters", async () => {
    await expect(
      createContactSchema.validate({
        name: "A".repeat(201),
        number: "5511999999999"
      })
    ).rejects.toThrow()
  })

  it("rejects number longer than 50 characters", async () => {
    await expect(
      createContactSchema.validate({
        name: "Alice",
        number: "1".repeat(51)
      })
    ).rejects.toThrow()
  })

  it("rejects invalid email if provided", async () => {
    await expect(
      createContactSchema.validate({
        name: "Alice",
        number: "5511999999999",
        email: "not-email"
      })
    ).rejects.toThrow("Invalid email")
  })

  it("accepts null email", async () => {
    const result = await createContactSchema.validate({
      name: "Alice",
      number: "5511999999999",
      email: null
    })
    expect(result.email).toBeNull()
  })

  it("accepts null customFields", async () => {
    const result = await createContactSchema.validate({
      name: "Alice",
      number: "5511999999999",
      customFields: null
    })
    expect(result.customFields).toBeNull()
  })
})

describe("updateContactSchema", () => {
  it("validates a payload with all optional fields", async () => {
    const result = await updateContactSchema.validate({
      name: "Bob",
      number: "5511888888888",
      email: "bob@example.com",
      profilePicUrl: "https://example.com/pic.jpg",
      telegramId: "12345",
      instagramId: "bob_ig",
      facebookId: "bob_fb",
      isGroup: false,
      customFields: null,
      walletId: "wallet-abc"
    })
    expect(result.name).toBe("Bob")
    expect(result.profilePicUrl).toBe("https://example.com/pic.jpg")
    expect(result.walletId).toBe("wallet-abc")
  })

  it("validates an empty payload (all fields optional)", async () => {
    const result = await updateContactSchema.validate({})
    expect(result).toBeDefined()
  })

  it("rejects invalid email if provided", async () => {
    await expect(
      updateContactSchema.validate({ email: "bad-email" })
    ).rejects.toThrow("Invalid email")
  })

  it("rejects invalid profilePicUrl if provided", async () => {
    await expect(
      updateContactSchema.validate({ profilePicUrl: "not-a-url" })
    ).rejects.toThrow()
  })

  it("accepts null for nullable fields", async () => {
    const result = await updateContactSchema.validate({
      email: null,
      profilePicUrl: null,
      telegramId: null,
      instagramId: null,
      facebookId: null,
      customFields: null,
      walletId: null
    })
    expect(result.email).toBeNull()
    expect(result.profilePicUrl).toBeNull()
  })
})

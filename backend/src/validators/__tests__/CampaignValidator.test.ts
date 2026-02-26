import { describe, it, expect } from "vitest"
import {
  createCampaignSchema,
  updateCampaignSchema,
  addContactsSchema
} from "../CampaignValidator"

describe("createCampaignSchema", () => {
  it("validates a correct payload with required fields", async () => {
    const result = await createCampaignSchema.validate({
      name: "Summer Campaign",
      message: "Hello customers!",
      whatsappId: 1
    })
    expect(result.name).toBe("Summer Campaign")
    expect(result.message).toBe("Hello customers!")
    expect(result.whatsappId).toBe(1)
  })

  it("validates a full payload with optional fields", async () => {
    const scheduledDate = new Date("2026-06-01T10:00:00Z")
    const result = await createCampaignSchema.validate({
      name: "Summer Campaign",
      message: "Hello!",
      whatsappId: 1,
      mediaUrl: "https://example.com/promo.jpg",
      scheduledAt: scheduledDate
    })
    expect(result.mediaUrl).toBe("https://example.com/promo.jpg")
    expect(result.scheduledAt).toEqual(scheduledDate)
  })

  it("rejects missing name", async () => {
    await expect(
      createCampaignSchema.validate({
        message: "Hello!",
        whatsappId: 1
      })
    ).rejects.toThrow("Name is required")
  })

  it("rejects missing message", async () => {
    await expect(
      createCampaignSchema.validate({
        name: "Campaign",
        whatsappId: 1
      })
    ).rejects.toThrow("Message is required")
  })

  it("rejects missing whatsappId", async () => {
    await expect(
      createCampaignSchema.validate({
        name: "Campaign",
        message: "Hello!"
      })
    ).rejects.toThrow("WhatsApp ID is required")
  })

  it("rejects name longer than 200 characters", async () => {
    await expect(
      createCampaignSchema.validate({
        name: "A".repeat(201),
        message: "Hello!",
        whatsappId: 1
      })
    ).rejects.toThrow()
  })

  it("rejects invalid mediaUrl if provided", async () => {
    await expect(
      createCampaignSchema.validate({
        name: "Campaign",
        message: "Hello!",
        whatsappId: 1,
        mediaUrl: "not-a-url"
      })
    ).rejects.toThrow("Invalid URL")
  })

  it("rejects non-integer whatsappId", async () => {
    await expect(
      createCampaignSchema.validate({
        name: "Campaign",
        message: "Hello!",
        whatsappId: 1.5
      })
    ).rejects.toThrow()
  })
})

describe("updateCampaignSchema", () => {
  it("validates a payload with all optional fields", async () => {
    const result = await updateCampaignSchema.validate({
      name: "Updated Campaign",
      message: "Updated message",
      whatsappId: 2,
      mediaUrl: "https://example.com/new.jpg",
      scheduledAt: new Date("2026-07-01T10:00:00Z")
    })
    expect(result.name).toBe("Updated Campaign")
    expect(result.whatsappId).toBe(2)
  })

  it("validates an empty payload (all fields optional)", async () => {
    const result = await updateCampaignSchema.validate({})
    expect(result).toBeDefined()
  })

  it("rejects invalid mediaUrl if provided", async () => {
    await expect(
      updateCampaignSchema.validate({ mediaUrl: "not-a-url" })
    ).rejects.toThrow("Invalid URL")
  })

  it("rejects name longer than 200 characters", async () => {
    await expect(
      updateCampaignSchema.validate({ name: "A".repeat(201) })
    ).rejects.toThrow()
  })
})

describe("addContactsSchema", () => {
  it("validates a correct payload", async () => {
    const result = await addContactsSchema.validate({
      contactIds: [1, 2, 3]
    })
    expect(result.contactIds).toEqual([1, 2, 3])
  })

  it("rejects missing contactIds", async () => {
    await expect(
      addContactsSchema.validate({})
    ).rejects.toThrow("Contact IDs are required")
  })

  it("rejects empty contactIds array", async () => {
    await expect(
      addContactsSchema.validate({ contactIds: [] })
    ).rejects.toThrow("At least one contact is required")
  })

  it("validates contactIds with a single element", async () => {
    const result = await addContactsSchema.validate({
      contactIds: [42]
    })
    expect(result.contactIds).toEqual([42])
  })
})

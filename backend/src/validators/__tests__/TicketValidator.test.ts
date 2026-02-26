import { describe, it, expect } from "vitest"
import { createTicketSchema, updateTicketSchema } from "../TicketValidator"

describe("createTicketSchema", () => {
  it("validates a correct payload with required fields", async () => {
    const result = await createTicketSchema.validate({
      contactId: 1
    })
    expect(result.contactId).toBe(1)
    expect(result.status).toBe("pending")
  })

  it("validates a full payload with all fields", async () => {
    const result = await createTicketSchema.validate({
      contactId: 5,
      queueId: 2,
      whatsappId: 3,
      status: "open",
      channel: "whatsapp"
    })
    expect(result.contactId).toBe(5)
    expect(result.queueId).toBe(2)
    expect(result.whatsappId).toBe(3)
    expect(result.status).toBe("open")
    expect(result.channel).toBe("whatsapp")
  })

  it("rejects missing contactId", async () => {
    await expect(
      createTicketSchema.validate({})
    ).rejects.toThrow("Contact ID is required")
  })

  it("rejects non-integer contactId", async () => {
    await expect(
      createTicketSchema.validate({ contactId: 1.5 })
    ).rejects.toThrow()
  })

  it("rejects invalid status value", async () => {
    await expect(
      createTicketSchema.validate({ contactId: 1, status: "invalid" })
    ).rejects.toThrow()
  })

  it("accepts all valid status values", async () => {
    const statuses = ["open", "pending", "closed"]
    for (const status of statuses) {
      const result = await createTicketSchema.validate({
        contactId: 1,
        status
      })
      expect(result.status).toBe(status)
    }
  })

  it("accepts null for nullable fields", async () => {
    const result = await createTicketSchema.validate({
      contactId: 1,
      queueId: null,
      whatsappId: null,
      channel: null
    })
    expect(result.queueId).toBeNull()
    expect(result.whatsappId).toBeNull()
    expect(result.channel).toBeNull()
  })
})

describe("updateTicketSchema", () => {
  it("validates a payload with all optional fields", async () => {
    const result = await updateTicketSchema.validate({
      userId: 2,
      queueId: 3,
      status: "closed",
      isFarewellMessage: true
    })
    expect(result.userId).toBe(2)
    expect(result.queueId).toBe(3)
    expect(result.status).toBe("closed")
    expect(result.isFarewellMessage).toBe(true)
  })

  it("validates an empty payload (all fields optional)", async () => {
    const result = await updateTicketSchema.validate({})
    expect(result).toBeDefined()
  })

  it("rejects invalid status if provided", async () => {
    await expect(
      updateTicketSchema.validate({ status: "unknown" })
    ).rejects.toThrow()
  })

  it("accepts null for nullable fields", async () => {
    const result = await updateTicketSchema.validate({
      userId: null,
      queueId: null
    })
    expect(result.userId).toBeNull()
    expect(result.queueId).toBeNull()
  })
})

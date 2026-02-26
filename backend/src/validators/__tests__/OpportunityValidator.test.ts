import { describe, it, expect } from "vitest"
import {
  createOpportunitySchema,
  updateOpportunitySchema,
  moveOpportunitySchema
} from "../OpportunityValidator"

describe("createOpportunitySchema", () => {
  it("validates a correct payload with required fields", async () => {
    const result = await createOpportunitySchema.validate({
      contactId: 1,
      pipelineId: 2,
      stageId: 3
    })
    expect(result.contactId).toBe(1)
    expect(result.pipelineId).toBe(2)
    expect(result.stageId).toBe(3)
  })

  it("validates a full payload with optional fields", async () => {
    const result = await createOpportunitySchema.validate({
      contactId: 1,
      pipelineId: 2,
      stageId: 3,
      value: 5000.50,
      status: "won"
    })
    expect(result.value).toBe(5000.50)
    expect(result.status).toBe("won")
  })

  it("rejects missing contactId", async () => {
    await expect(
      createOpportunitySchema.validate({ pipelineId: 2, stageId: 3 })
    ).rejects.toThrow("Contact ID is required")
  })

  it("rejects missing pipelineId", async () => {
    await expect(
      createOpportunitySchema.validate({ contactId: 1, stageId: 3 })
    ).rejects.toThrow("Pipeline ID is required")
  })

  it("rejects missing stageId", async () => {
    await expect(
      createOpportunitySchema.validate({ contactId: 1, pipelineId: 2 })
    ).rejects.toThrow("Stage ID is required")
  })

  it("rejects negative value", async () => {
    await expect(
      createOpportunitySchema.validate({
        contactId: 1,
        pipelineId: 2,
        stageId: 3,
        value: -100
      })
    ).rejects.toThrow("Value must be at least 0")
  })

  it("accepts value of 0", async () => {
    const result = await createOpportunitySchema.validate({
      contactId: 1,
      pipelineId: 2,
      stageId: 3,
      value: 0
    })
    expect(result.value).toBe(0)
  })

  it("rejects invalid status value", async () => {
    await expect(
      createOpportunitySchema.validate({
        contactId: 1,
        pipelineId: 2,
        stageId: 3,
        status: "invalid"
      })
    ).rejects.toThrow("Invalid status")
  })

  it("accepts all valid status values", async () => {
    const statuses = ["open", "won", "lost"]
    for (const status of statuses) {
      const result = await createOpportunitySchema.validate({
        contactId: 1,
        pipelineId: 2,
        stageId: 3,
        status
      })
      expect(result.status).toBe(status)
    }
  })

  it("rejects non-integer contactId", async () => {
    await expect(
      createOpportunitySchema.validate({
        contactId: 1.5,
        pipelineId: 2,
        stageId: 3
      })
    ).rejects.toThrow()
  })
})

describe("updateOpportunitySchema", () => {
  it("validates a payload with all optional fields", async () => {
    const result = await updateOpportunitySchema.validate({
      contactId: 10,
      pipelineId: 20,
      stageId: 30,
      value: 999,
      status: "lost"
    })
    expect(result.contactId).toBe(10)
    expect(result.status).toBe("lost")
  })

  it("validates an empty payload (all fields optional)", async () => {
    const result = await updateOpportunitySchema.validate({})
    expect(result).toBeDefined()
  })

  it("rejects negative value if provided", async () => {
    await expect(
      updateOpportunitySchema.validate({ value: -1 })
    ).rejects.toThrow("Value must be at least 0")
  })

  it("rejects invalid status if provided", async () => {
    await expect(
      updateOpportunitySchema.validate({ status: "pending" })
    ).rejects.toThrow("Invalid status")
  })
})

describe("moveOpportunitySchema", () => {
  it("validates a correct payload", async () => {
    const result = await moveOpportunitySchema.validate({ stageId: 5 })
    expect(result.stageId).toBe(5)
  })

  it("rejects missing stageId", async () => {
    await expect(
      moveOpportunitySchema.validate({})
    ).rejects.toThrow("Stage ID is required")
  })

  it("rejects non-integer stageId", async () => {
    await expect(
      moveOpportunitySchema.validate({ stageId: 2.5 })
    ).rejects.toThrow()
  })
})

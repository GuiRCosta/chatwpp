import { describe, it, expect } from "vitest"
import { listTemplatesSchema, syncTemplatesSchema } from "../TemplateValidator"

describe("listTemplatesSchema", () => {
  it("validates empty query (whatsappId is optional)", async () => {
    const result = await listTemplatesSchema.validate({})
    expect(result).toBeDefined()
  })

  it("validates whatsappId as number", async () => {
    const result = await listTemplatesSchema.validate({ whatsappId: 42 })
    expect(result.whatsappId).toBe(42)
  })

  it("coerces whatsappId string to number", async () => {
    const result = await listTemplatesSchema.validate({ whatsappId: "7" })
    expect(result.whatsappId).toBe(7)
  })

  it("rejects whatsappId <= 0", async () => {
    await expect(
      listTemplatesSchema.validate({ whatsappId: 0 })
    ).rejects.toThrow()
  })

  it("rejects non-integer whatsappId", async () => {
    await expect(
      listTemplatesSchema.validate({ whatsappId: 1.5 })
    ).rejects.toThrow()
  })

  it("rejects non-numeric whatsappId", async () => {
    await expect(
      listTemplatesSchema.validate({ whatsappId: "abc" })
    ).rejects.toThrow()
  })
})

describe("syncTemplatesSchema", () => {
  it("validates empty body (whatsappId is optional)", async () => {
    const result = await syncTemplatesSchema.validate({})
    expect(result).toBeDefined()
  })

  it("validates whatsappId as number", async () => {
    const result = await syncTemplatesSchema.validate({ whatsappId: 10 })
    expect(result.whatsappId).toBe(10)
  })

  it("rejects whatsappId <= 0", async () => {
    await expect(
      syncTemplatesSchema.validate({ whatsappId: -1 })
    ).rejects.toThrow()
  })

  it("rejects non-integer whatsappId", async () => {
    await expect(
      syncTemplatesSchema.validate({ whatsappId: 2.5 })
    ).rejects.toThrow()
  })

  it("strips unknown fields", async () => {
    const result = await syncTemplatesSchema.validate(
      { whatsappId: 5, malicious: "payload" },
      { stripUnknown: true }
    )
    expect(result).toEqual({ whatsappId: 5 })
    expect((result as Record<string, unknown>).malicious).toBeUndefined()
  })
})

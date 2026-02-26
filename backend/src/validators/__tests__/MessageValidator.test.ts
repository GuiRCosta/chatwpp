import { describe, it, expect } from "vitest"
import { createMessageSchema } from "../MessageValidator"

describe("createMessageSchema", () => {
  it("validates a correct payload with required fields", async () => {
    const result = await createMessageSchema.validate({
      body: "Hello world"
    })
    expect(result.body).toBe("Hello world")
    expect(result.fromMe).toBe(true)
  })

  it("validates a full payload with all fields", async () => {
    const result = await createMessageSchema.validate({
      body: "Check this out",
      mediaUrl: "https://example.com/image.png",
      mediaType: "image",
      fromMe: false,
      quotedMsgId: "msg-abc-123"
    })
    expect(result.body).toBe("Check this out")
    expect(result.mediaUrl).toBe("https://example.com/image.png")
    expect(result.mediaType).toBe("image")
    expect(result.fromMe).toBe(false)
    expect(result.quotedMsgId).toBe("msg-abc-123")
  })

  it("rejects missing body", async () => {
    await expect(
      createMessageSchema.validate({})
    ).rejects.toThrow("Message body is required")
  })

  it("accepts non-URL mediaUrl (filename path)", async () => {
    const result = await createMessageSchema.validate({
      body: "test",
      mediaUrl: "1/abc123def456.ogg"
    })
    expect(result.mediaUrl).toBe("1/abc123def456.ogg")
  })

  it("allows body to be null when mediaType is present", async () => {
    const result = await createMessageSchema.validate({
      mediaUrl: "1/abc123.ogg",
      mediaType: "audio"
    })
    expect(result.mediaType).toBe("audio")
    expect(result.mediaUrl).toBe("1/abc123.ogg")
  })

  it("still requires body when mediaType is absent", async () => {
    await expect(
      createMessageSchema.validate({
        mediaUrl: "1/abc123.ogg"
      })
    ).rejects.toThrow("Message body is required")
  })

  it("accepts null for nullable fields", async () => {
    const result = await createMessageSchema.validate({
      body: "test",
      mediaUrl: null,
      mediaType: null,
      quotedMsgId: null
    })
    expect(result.mediaUrl).toBeNull()
    expect(result.mediaType).toBeNull()
    expect(result.quotedMsgId).toBeNull()
  })

  it("defaults fromMe to true when not provided", async () => {
    const result = await createMessageSchema.validate({
      body: "test message"
    })
    expect(result.fromMe).toBe(true)
  })
})

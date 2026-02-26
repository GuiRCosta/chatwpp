import { describe, it, expect } from "vitest"
import crypto from "crypto"
import { verifySignature } from "../webhookSignature"

describe("webhookSignature", () => {
  const appSecret = "test-app-secret"

  function createValidSignature(body: string): string {
    const hash = crypto
      .createHmac("sha256", appSecret)
      .update(Buffer.from(body))
      .digest("hex")
    return `sha256=${hash}`
  }

  describe("verifySignature", () => {
    it("returns true for a valid signature", () => {
      const body = '{"test": "data"}'
      const rawBody = Buffer.from(body)
      const signature = createValidSignature(body)

      const result = verifySignature(rawBody, signature, appSecret)

      expect(result).toBe(true)
    })

    it("returns false for an invalid signature", () => {
      const body = '{"test": "data"}'
      const rawBody = Buffer.from(body)
      const signature = "sha256=0000000000000000000000000000000000000000000000000000000000000000"

      const result = verifySignature(rawBody, signature, appSecret)

      expect(result).toBe(false)
    })

    it("returns false when signature is undefined", () => {
      const rawBody = Buffer.from('{"test": "data"}')

      const result = verifySignature(rawBody, undefined, appSecret)

      expect(result).toBe(false)
    })

    it("handles signature without sha256= prefix", () => {
      const body = '{"test": "data"}'
      const rawBody = Buffer.from(body)
      const hash = crypto
        .createHmac("sha256", appSecret)
        .update(rawBody)
        .digest("hex")

      const result = verifySignature(rawBody, hash, appSecret)

      expect(result).toBe(true)
    })

    it("returns false when body has been tampered with", () => {
      const originalBody = '{"test": "original"}'
      const signature = createValidSignature(originalBody)
      const tamperedBody = Buffer.from('{"test": "tampered"}')

      const result = verifySignature(tamperedBody, signature, appSecret)

      expect(result).toBe(false)
    })

    it("returns false when using wrong secret", () => {
      const body = '{"test": "data"}'
      const rawBody = Buffer.from(body)
      const signature = createValidSignature(body)

      const result = verifySignature(rawBody, signature, "wrong-secret")

      expect(result).toBe(false)
    })

    it("works with empty body", () => {
      const body = ""
      const rawBody = Buffer.from(body)
      const signature = createValidSignature(body)

      const result = verifySignature(rawBody, signature, appSecret)

      expect(result).toBe(true)
    })

    it("works with large body", () => {
      const body = JSON.stringify({ data: "x".repeat(10000) })
      const rawBody = Buffer.from(body)
      const signature = createValidSignature(body)

      const result = verifySignature(rawBody, signature, appSecret)

      expect(result).toBe(true)
    })
  })
})

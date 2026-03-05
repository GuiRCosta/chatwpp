import { encrypt, decrypt, isEncrypted, resetKeyCache } from "../encryption"

const TEST_KEY = "a".repeat(64)

beforeEach(() => {
  resetKeyCache()
  process.env.ENCRYPTION_KEY = TEST_KEY
})

afterEach(() => {
  resetKeyCache()
  delete process.env.ENCRYPTION_KEY
})

describe("encrypt", () => {
  it("should return encrypted string in iv:authTag:ciphertext format", () => {
    const result = encrypt("my-secret-token")

    const parts = result.split(":")
    expect(parts).toHaveLength(3)
    expect(parts[0]).toHaveLength(24) // 12 bytes = 24 hex chars (IV)
    expect(parts[1]).toHaveLength(32) // 16 bytes = 32 hex chars (auth tag)
    expect(parts[2].length).toBeGreaterThan(0)
  })

  it("should produce different ciphertext for same plaintext (unique IV)", () => {
    const a = encrypt("same-value")
    const b = encrypt("same-value")

    expect(a).not.toBe(b)
  })

  it("should return empty string for empty input", () => {
    expect(encrypt("")).toBe("")
  })

  it("should throw if ENCRYPTION_KEY is not set", () => {
    delete process.env.ENCRYPTION_KEY

    expect(() => encrypt("test")).toThrow("ENCRYPTION_KEY is not configured")
  })

  it("should throw if ENCRYPTION_KEY has wrong length", () => {
    process.env.ENCRYPTION_KEY = "tooshort"

    expect(() => encrypt("test")).toThrow("must be 64 hex characters")
  })
})

describe("decrypt", () => {
  it("should decrypt back to original plaintext", () => {
    const original = "EAARb1234567890abcdef"
    const encrypted = encrypt(original)
    const decrypted = decrypt(encrypted)

    expect(decrypted).toBe(original)
  })

  it("should handle unicode characters", () => {
    const original = "token-with-special-chars-àéîõü-中文"
    const encrypted = encrypt(original)
    const decrypted = decrypt(encrypted)

    expect(decrypted).toBe(original)
  })

  it("should handle long tokens", () => {
    const original = "x".repeat(5000)
    const encrypted = encrypt(original)
    const decrypted = decrypt(encrypted)

    expect(decrypted).toBe(original)
  })

  it("should return empty string for empty input", () => {
    expect(decrypt("")).toBe("")
  })

  it("should throw on tampered ciphertext", () => {
    const encrypted = encrypt("secret")
    const parts = encrypted.split(":")

    parts[2] = "ff" + parts[2].slice(2)
    const tampered = parts.join(":")

    expect(() => decrypt(tampered)).toThrow()
  })

  it("should throw on tampered auth tag", () => {
    const encrypted = encrypt("secret")
    const parts = encrypted.split(":")

    parts[1] = "00".repeat(16)
    const tampered = parts.join(":")

    expect(() => decrypt(tampered)).toThrow()
  })

  it("should throw on malformed format", () => {
    expect(() => decrypt("not-valid-format")).toThrow(
      "Invalid encrypted format"
    )
  })

  it("should throw on invalid IV length", () => {
    const shortIv = "aa".repeat(4)
    const validTag = "bb".repeat(16)
    expect(() => decrypt(`${shortIv}:${validTag}:ccdd`)).toThrow(
      "Invalid IV length"
    )
  })
})

describe("isEncrypted", () => {
  it("should return true for encrypted values", () => {
    const encrypted = encrypt("some-token")

    expect(isEncrypted(encrypted)).toBe(true)
  })

  it("should return false for plain text tokens", () => {
    expect(isEncrypted("EAARb1234567890abcdef")).toBe(false)
  })

  it("should return false for empty string", () => {
    expect(isEncrypted("")).toBe(false)
  })

  it("should return false for values with wrong number of parts", () => {
    expect(isEncrypted("only:two")).toBe(false)
    expect(isEncrypted("a:b:c:d")).toBe(false)
  })

  it("should return false for non-hex characters in parts", () => {
    const validIv = "aa".repeat(12)
    const validTag = "bb".repeat(16)

    expect(isEncrypted(`${validIv}:${validTag}:zzzzzz`)).toBe(false)
  })

  it("should return false for wrong IV length", () => {
    const shortIv = "aa".repeat(6)
    const validTag = "bb".repeat(16)

    expect(isEncrypted(`${shortIv}:${validTag}:cc`)).toBe(false)
  })

  it("should return false for wrong auth tag length", () => {
    const validIv = "aa".repeat(12)
    const shortTag = "bb".repeat(8)

    expect(isEncrypted(`${validIv}:${shortTag}:cc`)).toBe(false)
  })
})

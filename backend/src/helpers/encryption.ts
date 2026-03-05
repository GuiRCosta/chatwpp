import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16
const SEPARATOR = ":"

let encryptionKey: Buffer | null = null

function getKey(): Buffer {
  if (encryptionKey) return encryptionKey

  const keyHex = process.env.ENCRYPTION_KEY
  if (!keyHex) {
    throw new Error(
      "FATAL: ENCRYPTION_KEY is not configured. Generate with: openssl rand -hex 32"
    )
  }

  if (keyHex.length !== 64) {
    throw new Error(
      "FATAL: ENCRYPTION_KEY must be 64 hex characters (32 bytes). Current length: " +
        keyHex.length
    )
  }

  encryptionKey = Buffer.from(keyHex, "hex")
  return encryptionKey
}

export function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext

  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH
  })

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final()
  ])

  const authTag = cipher.getAuthTag()

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex")
  ].join(SEPARATOR)
}

export function decrypt(encrypted: string): string {
  if (!encrypted) return encrypted

  const key = getKey()
  const parts = encrypted.split(SEPARATOR)

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format: expected iv:authTag:ciphertext")
  }

  const iv = Buffer.from(parts[0], "hex")
  const authTag = Buffer.from(parts[1], "hex")
  const ciphertext = Buffer.from(parts[2], "hex")

  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`)
  }

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error(
      `Invalid auth tag length: expected ${AUTH_TAG_LENGTH}, got ${authTag.length}`
    )
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH
  })
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ])

  return decrypted.toString("utf8")
}

const HEX_PATTERN = /^[0-9a-f]+$/i

export function isEncrypted(value: string): boolean {
  if (!value) return false

  const parts = value.split(SEPARATOR)
  if (parts.length !== 3) return false

  const [iv, authTag, ciphertext] = parts

  return (
    iv.length === IV_LENGTH * 2 &&
    authTag.length === AUTH_TAG_LENGTH * 2 &&
    ciphertext.length > 0 &&
    HEX_PATTERN.test(iv) &&
    HEX_PATTERN.test(authTag) &&
    HEX_PATTERN.test(ciphertext)
  )
}

export function resetKeyCache(): void {
  encryptionKey = null
}

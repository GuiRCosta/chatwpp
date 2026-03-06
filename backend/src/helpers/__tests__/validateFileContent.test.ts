import { describe, it, expect, afterEach } from "vitest"
import fs from "fs"
import path from "path"
import os from "os"
import { validateFileContent } from "../validateFileContent"

function createTempFile(content: Buffer): string {
  const tmpDir = os.tmpdir()
  const filePath = path.join(tmpDir, `test-upload-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  fs.writeFileSync(filePath, content)
  return filePath
}

const createdFiles: string[] = []

function trackFile(filePath: string): string {
  createdFiles.push(filePath)
  return filePath
}

afterEach(() => {
  for (const f of createdFiles) {
    try {
      fs.unlinkSync(f)
    } catch {
      // File already deleted by validation
    }
  }
  createdFiles.length = 0
})

// Minimal valid file headers (magic bytes)
const JPEG_HEADER = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00])
// PNG needs signature (8 bytes) + IHDR chunk header (8 bytes) + IHDR data (13 bytes) + CRC (4 bytes)
const PNG_HEADER = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  0x00, 0x00, 0x00, 0x0D, // IHDR chunk length (13)
  0x49, 0x48, 0x44, 0x52, // "IHDR"
  0x00, 0x00, 0x00, 0x01, // width: 1
  0x00, 0x00, 0x00, 0x01, // height: 1
  0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
  0x90, 0x77, 0x53, 0xDE  // CRC
])
const GIF_HEADER = Buffer.from("GIF89a")
const PDF_HEADER = Buffer.from("%PDF-1.4")

describe("validateFileContent", () => {
  describe("text-based files", () => {
    it("skips validation for text/plain", async () => {
      const filePath = trackFile(createTempFile(Buffer.from("Hello, world!")))

      await expect(validateFileContent(filePath, "text/plain")).resolves.toBeUndefined()
      expect(fs.existsSync(filePath)).toBe(true)
    })

    it("skips validation for text/csv", async () => {
      const filePath = trackFile(createTempFile(Buffer.from("name,email\nJohn,john@test.com")))

      await expect(validateFileContent(filePath, "text/csv")).resolves.toBeUndefined()
      expect(fs.existsSync(filePath)).toBe(true)
    })
  })

  describe("valid binary files", () => {
    it("accepts JPEG file with image/jpeg MIME", async () => {
      const filePath = trackFile(createTempFile(JPEG_HEADER))

      await expect(validateFileContent(filePath, "image/jpeg")).resolves.toBeUndefined()
      expect(fs.existsSync(filePath)).toBe(true)
    })

    it("accepts PNG file with image/png MIME", async () => {
      const filePath = trackFile(createTempFile(PNG_HEADER))

      await expect(validateFileContent(filePath, "image/png")).resolves.toBeUndefined()
      expect(fs.existsSync(filePath)).toBe(true)
    })

    it("accepts GIF file with image/gif MIME", async () => {
      const filePath = trackFile(createTempFile(GIF_HEADER))

      await expect(validateFileContent(filePath, "image/gif")).resolves.toBeUndefined()
      expect(fs.existsSync(filePath)).toBe(true)
    })

    it("accepts PDF file with application/pdf MIME", async () => {
      const filePath = trackFile(createTempFile(PDF_HEADER))

      await expect(validateFileContent(filePath, "application/pdf")).resolves.toBeUndefined()
      expect(fs.existsSync(filePath)).toBe(true)
    })
  })

  describe("mismatched files", () => {
    it("rejects PNG content declared as image/jpeg", async () => {
      const filePath = trackFile(createTempFile(PNG_HEADER))

      await expect(validateFileContent(filePath, "image/jpeg")).rejects.toThrow(
        "File content (image/png) does not match declared type (image/jpeg)"
      )
      expect(fs.existsSync(filePath)).toBe(false)
    })

    it("rejects JPEG content declared as image/png", async () => {
      const filePath = trackFile(createTempFile(JPEG_HEADER))

      await expect(validateFileContent(filePath, "image/png")).rejects.toThrow(
        "File content (image/jpeg) does not match declared type (image/png)"
      )
      expect(fs.existsSync(filePath)).toBe(false)
    })

    it("rejects PDF content declared as image/jpeg", async () => {
      const filePath = trackFile(createTempFile(PDF_HEADER))

      await expect(validateFileContent(filePath, "image/jpeg")).rejects.toThrow(
        "does not match declared type"
      )
      expect(fs.existsSync(filePath)).toBe(false)
    })
  })

  describe("unrecognizable files", () => {
    it("rejects binary file that file-type cannot identify", async () => {
      const randomBytes = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05])
      const filePath = trackFile(createTempFile(randomBytes))

      await expect(validateFileContent(filePath, "image/png")).rejects.toThrow(
        "Unable to verify file content type"
      )
      expect(fs.existsSync(filePath)).toBe(false)
    })
  })

  describe("undeclared MIME type", () => {
    it("rejects file with MIME type not in allowlist", async () => {
      const filePath = trackFile(createTempFile(JPEG_HEADER))

      await expect(validateFileContent(filePath, "application/x-executable")).rejects.toThrow(
        "does not match declared type"
      )
      expect(fs.existsSync(filePath)).toBe(false)
    })
  })
})

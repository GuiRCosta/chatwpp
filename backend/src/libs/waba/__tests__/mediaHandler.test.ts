import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("../wabaClient", () => ({
  getMediaUrl: vi.fn(),
  downloadMedia: vi.fn()
}))

vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn()
  }
}))

vi.mock("crypto", () => {
  const actual = {
    randomBytes: () => Buffer.from("a1b2c3d4e5f6a1b2a1b2c3d4e5f6a1b2")
  }
  return { default: actual }
})

vi.mock("@/helpers/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

import { downloadAndSaveMedia } from "../mediaHandler"
import { getMediaUrl, downloadMedia } from "../wabaClient"
import fs from "fs"

describe("mediaHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fs.existsSync).mockReturnValue(true)
  })

  describe("downloadAndSaveMedia", () => {
    it("downloads and saves an image", async () => {
      vi.mocked(getMediaUrl).mockResolvedValue({
        id: "media-123",
        messaging_product: "whatsapp",
        url: "https://lookaside.fbsbx.com/media123",
        mime_type: "image/jpeg",
        sha256: "abc",
        file_size: 12345
      })

      const buffer = Buffer.from("fake image data")
      vi.mocked(downloadMedia).mockResolvedValue(buffer)

      const result = await downloadAndSaveMedia("media-123", "token-abc", 1)

      expect(getMediaUrl).toHaveBeenCalledWith("media-123", "token-abc")
      expect(downloadMedia).toHaveBeenCalledWith(
        "https://lookaside.fbsbx.com/media123",
        "token-abc"
      )
      expect(fs.writeFileSync).toHaveBeenCalled()
      expect(result.localPath).toMatch(/^1\//)
      expect(result.localPath).toContain(".jpg")
      expect(result.mediaType).toBe("image")
      expect(result.mimeType).toBe("image/jpeg")
    })

    it("creates tenant directory if it does not exist", async () => {
      vi.mocked(getMediaUrl).mockResolvedValue({
        id: "media-456",
        messaging_product: "whatsapp",
        url: "https://lookaside.fbsbx.com/media456",
        mime_type: "image/png",
        sha256: "def",
        file_size: 5000
      })

      vi.mocked(downloadMedia).mockResolvedValue(Buffer.from("png data"))
      vi.mocked(fs.existsSync).mockReturnValue(false)

      await downloadAndSaveMedia("media-456", "token-abc", 42)

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining("42"),
        { recursive: true }
      )
    })

    it("handles video mime type correctly", async () => {
      vi.mocked(getMediaUrl).mockResolvedValue({
        id: "media-789",
        messaging_product: "whatsapp",
        url: "https://example.com/video",
        mime_type: "video/mp4",
        sha256: "ghi",
        file_size: 50000
      })

      vi.mocked(downloadMedia).mockResolvedValue(Buffer.from("video data"))

      const result = await downloadAndSaveMedia("media-789", "token", 1)

      expect(result.mediaType).toBe("video")
      expect(result.localPath).toContain(".mp4")
    })

    it("handles audio mime type correctly", async () => {
      vi.mocked(getMediaUrl).mockResolvedValue({
        id: "media-audio",
        messaging_product: "whatsapp",
        url: "https://example.com/audio",
        mime_type: "audio/ogg",
        sha256: "jkl",
        file_size: 3000
      })

      vi.mocked(downloadMedia).mockResolvedValue(Buffer.from("audio data"))

      const result = await downloadAndSaveMedia("media-audio", "token", 1)

      expect(result.mediaType).toBe("audio")
      expect(result.localPath).toContain(".ogg")
    })

    it("handles document mime type correctly", async () => {
      vi.mocked(getMediaUrl).mockResolvedValue({
        id: "media-doc",
        messaging_product: "whatsapp",
        url: "https://example.com/doc",
        mime_type: "application/pdf",
        sha256: "mno",
        file_size: 20000
      })

      vi.mocked(downloadMedia).mockResolvedValue(Buffer.from("pdf data"))

      const result = await downloadAndSaveMedia("media-doc", "token", 1)

      expect(result.mediaType).toBe("document")
      expect(result.localPath).toContain(".pdf")
    })

    it("uses .bin extension for unknown mime type", async () => {
      vi.mocked(getMediaUrl).mockResolvedValue({
        id: "media-unknown",
        messaging_product: "whatsapp",
        url: "https://example.com/file",
        mime_type: "application/octet-stream",
        sha256: "pqr",
        file_size: 1000
      })

      vi.mocked(downloadMedia).mockResolvedValue(Buffer.from("binary data"))

      const result = await downloadAndSaveMedia("media-unknown", "token", 1)

      expect(result.mediaType).toBe("document")
      expect(result.localPath).toContain(".bin")
    })

    it("propagates errors from getMediaUrl", async () => {
      vi.mocked(getMediaUrl).mockRejectedValue(new Error("Media not found"))

      await expect(
        downloadAndSaveMedia("bad-id", "token", 1)
      ).rejects.toThrow("Media not found")
    })

    it("propagates errors from downloadMedia", async () => {
      vi.mocked(getMediaUrl).mockResolvedValue({
        id: "media-err",
        messaging_product: "whatsapp",
        url: "https://example.com/fail",
        mime_type: "image/jpeg",
        sha256: "stu",
        file_size: 500
      })

      vi.mocked(downloadMedia).mockRejectedValue(new Error("Download failed"))

      await expect(
        downloadAndSaveMedia("media-err", "token", 1)
      ).rejects.toThrow("Download failed")
    })
  })
})

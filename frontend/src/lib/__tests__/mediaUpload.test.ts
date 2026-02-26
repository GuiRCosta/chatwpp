import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/api", () => ({
  default: {
    post: vi.fn()
  }
}))

import api from "@/lib/api"
import { uploadMedia } from "../mediaUpload"

describe("uploadMedia", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("sends FormData with file to /upload endpoint", async () => {
    const mockResult = {
      mediaUrl: "1/abc123.ogg",
      mediaType: "audio",
      originalName: "recording.ogg",
      mimeType: "audio/ogg",
      size: 12345
    }
    vi.mocked(api.post).mockResolvedValue({
      data: { success: true, data: mockResult }
    })

    const blob = new Blob(["fake-audio"], { type: "audio/ogg" })
    const result = await uploadMedia(blob, "recording.ogg")

    expect(api.post).toHaveBeenCalledWith(
      "/upload",
      expect.any(FormData),
      { headers: { "Content-Type": "multipart/form-data" } }
    )
    expect(result).toEqual(mockResult)
  })

  it("returns upload result data", async () => {
    const mockResult = {
      mediaUrl: "1/xyz789.png",
      mediaType: "image",
      originalName: "photo.png",
      mimeType: "image/png",
      size: 54321
    }
    vi.mocked(api.post).mockResolvedValue({
      data: { success: true, data: mockResult }
    })

    const blob = new Blob(["fake-image"], { type: "image/png" })
    const result = await uploadMedia(blob, "photo.png")

    expect(result.mediaUrl).toBe("1/xyz789.png")
    expect(result.mediaType).toBe("image")
  })

  it("propagates API errors", async () => {
    vi.mocked(api.post).mockRejectedValue(new Error("Upload failed"))

    const blob = new Blob(["data"], { type: "audio/ogg" })

    await expect(uploadMedia(blob, "test.ogg")).rejects.toThrow("Upload failed")
  })
})

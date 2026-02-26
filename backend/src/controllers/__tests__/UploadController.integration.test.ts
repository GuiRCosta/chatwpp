import { describe, it, expect, vi, beforeEach } from "vitest"
import { createMockRequest, createMockResponse } from "@/__tests__/helpers"

vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
    renameSync: vi.fn()
  },
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
  renameSync: vi.fn()
}))

import fs from "fs"
import { store } from "@/controllers/UploadController"
import { AppError } from "@/helpers/AppError"

function createFileData(overrides: Record<string, unknown> = {}) {
  return {
    fieldname: "media",
    originalname: "recording.ogg",
    encoding: "7bit",
    mimetype: "audio/ogg",
    destination: "/tmp/uploads",
    filename: "abc123def456.ogg",
    path: "/tmp/uploads/abc123def456.ogg",
    size: 12345,
    ...overrides
  }
}

describe("UploadController", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("store", () => {
    it("returns 201 with media info for audio file", async () => {
      const req = createMockRequest({
        tenantId: 1,
        file: createFileData()
      })
      const res = createMockResponse()

      await store(req as never, res as never)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          mediaUrl: "1/abc123def456.ogg",
          mediaType: "audio",
          originalName: "recording.ogg",
          mimeType: "audio/ogg",
          size: 12345
        }
      })
    })

    it("returns mediaType 'image' for image mimes", async () => {
      const req = createMockRequest({
        tenantId: 1,
        file: createFileData({
          originalname: "photo.png",
          mimetype: "image/png",
          filename: "abc123.png",
          path: "/tmp/uploads/abc123.png"
        })
      })
      const res = createMockResponse()

      await store(req as never, res as never)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ mediaType: "image" })
        })
      )
    })

    it("returns mediaType 'video' for video mimes", async () => {
      const req = createMockRequest({
        tenantId: 1,
        file: createFileData({
          originalname: "clip.mp4",
          mimetype: "video/mp4",
          filename: "abc123.mp4",
          path: "/tmp/uploads/abc123.mp4"
        })
      })
      const res = createMockResponse()

      await store(req as never, res as never)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ mediaType: "video" })
        })
      )
    })

    it("returns mediaType 'document' for non-media mimes", async () => {
      const req = createMockRequest({
        tenantId: 1,
        file: createFileData({
          originalname: "document.pdf",
          mimetype: "application/pdf",
          filename: "abc123.pdf",
          path: "/tmp/uploads/abc123.pdf"
        })
      })
      const res = createMockResponse()

      await store(req as never, res as never)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ mediaType: "document" })
        })
      )
    })

    it("throws AppError when no file is uploaded", async () => {
      const req = createMockRequest({ tenantId: 1 })
      const res = createMockResponse()

      await expect(store(req as never, res as never)).rejects.toThrow(AppError)
      await expect(store(req as never, res as never)).rejects.toThrow(
        "No file uploaded"
      )
    })

    it("includes tenant id in mediaUrl path", async () => {
      const req = createMockRequest({
        tenantId: 5,
        file: createFileData({ filename: "xyz789.ogg" })
      })
      const res = createMockResponse()

      await store(req as never, res as never)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ mediaUrl: "5/xyz789.ogg" })
        })
      )
    })

    it("creates tenant directory if it does not exist", async () => {
      vi.mocked(fs.existsSync).mockReturnValueOnce(false)

      const req = createMockRequest({
        tenantId: 3,
        file: createFileData()
      })
      const res = createMockResponse()

      await store(req as never, res as never)

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining("3"),
        { recursive: true }
      )
    })

    it("does not create directory when it already exists", async () => {
      vi.mocked(fs.existsSync).mockReturnValueOnce(true)

      const req = createMockRequest({
        tenantId: 1,
        file: createFileData()
      })
      const res = createMockResponse()

      await store(req as never, res as never)

      expect(fs.mkdirSync).not.toHaveBeenCalled()
    })

    it("moves file from upload tmp to tenant directory", async () => {
      const req = createMockRequest({
        tenantId: 1,
        file: createFileData({
          path: "/tmp/uploads/abc123.ogg",
          filename: "abc123.ogg"
        })
      })
      const res = createMockResponse()

      await store(req as never, res as never)

      expect(fs.renameSync).toHaveBeenCalledWith(
        "/tmp/uploads/abc123.ogg",
        expect.stringContaining("abc123.ogg")
      )
    })

    it("handles audio/webm mime type (Safari)", async () => {
      const req = createMockRequest({
        tenantId: 1,
        file: createFileData({
          originalname: "recording.webm",
          mimetype: "audio/webm",
          filename: "abc123.webm"
        })
      })
      const res = createMockResponse()

      await store(req as never, res as never)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            mediaType: "audio",
            mimeType: "audio/webm"
          })
        })
      )
    })
  })
})

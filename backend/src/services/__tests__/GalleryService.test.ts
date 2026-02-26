import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/models/Gallery", () => ({
  default: {
    findOne: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn()
  }
}))

import {
  listGalleries,
  findGalleryById,
  createGallery,
  updateGallery,
  deleteGallery
} from "../GalleryService"
import Gallery from "@/models/Gallery"
import { AppError } from "@/helpers/AppError"

function buildGallery(overrides: Record<string, unknown> = {}) {
  const data = {
    id: 1,
    tenantId: 1,
    name: "Test Image",
    mediaUrl: "https://example.com/image.png",
    mediaType: "image",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides
  }
  return {
    ...data,
    update: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn().mockResolvedValue(undefined)
  }
}

describe("GalleryService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listGalleries", () => {
    it("returns galleries for a tenant", async () => {
      const mockGalleries = [
        buildGallery({ id: 1, name: "Image A" }),
        buildGallery({ id: 2, name: "Image B" })
      ]
      vi.mocked(Gallery.findAll).mockResolvedValue(mockGalleries as any)

      const result = await listGalleries({ tenantId: 1 })

      expect(result).toHaveLength(2)
      expect(Gallery.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 1 },
          order: [["name", "ASC"]]
        })
      )
    })

    it("filters by searchParam", async () => {
      vi.mocked(Gallery.findAll).mockResolvedValue([])

      await listGalleries({ tenantId: 1, searchParam: "logo" })

      expect(Gallery.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 1,
            name: expect.any(Object)
          })
        })
      )
    })

    it("filters by mediaType", async () => {
      vi.mocked(Gallery.findAll).mockResolvedValue([])

      await listGalleries({ tenantId: 1, mediaType: "video" })

      expect(Gallery.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 1,
            mediaType: "video"
          })
        })
      )
    })
  })

  describe("findGalleryById", () => {
    it("returns a gallery when found", async () => {
      const mockGallery = buildGallery({ id: 5 })
      vi.mocked(Gallery.findOne).mockResolvedValue(mockGallery as any)

      const result = await findGalleryById(5, 1)

      expect(result).toBeDefined()
      expect(Gallery.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 5, tenantId: 1 }
        })
      )
    })

    it("throws AppError when not found", async () => {
      vi.mocked(Gallery.findOne).mockResolvedValue(null)

      await expect(findGalleryById(999, 1)).rejects.toThrow(AppError)
      await expect(findGalleryById(999, 1)).rejects.toThrow("Gallery item not found")
    })
  })

  describe("createGallery", () => {
    it("creates a gallery item successfully", async () => {
      const created = buildGallery({ id: 10, name: "New Image" })
      vi.mocked(Gallery.create).mockResolvedValue(created as any)

      const result = await createGallery(1, {
        name: "New Image",
        mediaUrl: "https://example.com/new.png",
        mediaType: "image"
      })

      expect(result).toBeDefined()
      expect(Gallery.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          name: "New Image",
          mediaUrl: "https://example.com/new.png",
          mediaType: "image"
        })
      )
    })
  })

  describe("updateGallery", () => {
    it("updates a gallery item successfully", async () => {
      const mockGallery = buildGallery({ id: 1 })
      vi.mocked(Gallery.findOne).mockResolvedValue(mockGallery as any)

      const result = await updateGallery(1, 1, { name: "Updated Image" })

      expect(result).toBeDefined()
      expect(mockGallery.update).toHaveBeenCalledWith({ name: "Updated Image" })
    })

    it("throws AppError when not found", async () => {
      vi.mocked(Gallery.findOne).mockResolvedValue(null)

      await expect(
        updateGallery(999, 1, { name: "Updated" })
      ).rejects.toThrow("Gallery item not found")
    })
  })

  describe("deleteGallery", () => {
    it("deletes a gallery item successfully", async () => {
      const mockGallery = buildGallery({ id: 1 })
      vi.mocked(Gallery.findOne).mockResolvedValue(mockGallery as any)

      await deleteGallery(1, 1)

      expect(mockGallery.destroy).toHaveBeenCalled()
    })

    it("throws AppError when not found", async () => {
      vi.mocked(Gallery.findOne).mockResolvedValue(null)

      await expect(deleteGallery(999, 1)).rejects.toThrow("Gallery item not found")
    })
  })
})

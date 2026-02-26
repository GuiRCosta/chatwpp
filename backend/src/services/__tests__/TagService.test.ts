import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/models/Tag", () => ({
  default: {
    findOne: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn()
  }
}))

vi.mock("@/models/ContactTag", () => ({
  default: {
    destroy: vi.fn()
  }
}))

import {
  listTags,
  findTagById,
  createTag,
  updateTag,
  deleteTag
} from "../TagService"
import Tag from "@/models/Tag"
import ContactTag from "@/models/ContactTag"
import { buildTag } from "@/__tests__/factories"
import { AppError } from "@/helpers/AppError"

describe("TagService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listTags", () => {
    it("returns tags for a tenant", async () => {
      const mockTags = [
        buildTag({ id: 1, name: "Tag A" }),
        buildTag({ id: 2, name: "Tag B" })
      ]
      vi.mocked(Tag.findAll).mockResolvedValue(mockTags as any)

      const result = await listTags({ tenantId: 1 })

      expect(result).toHaveLength(2)
      expect(Tag.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 1 },
          order: [["name", "ASC"]]
        })
      )
    })

    it("filters by searchParam", async () => {
      vi.mocked(Tag.findAll).mockResolvedValue([])

      await listTags({ tenantId: 1, searchParam: "vip" })

      expect(Tag.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 1,
            name: expect.any(Object)
          })
        })
      )
    })
  })

  describe("findTagById", () => {
    it("returns a tag when found", async () => {
      const mockTag = buildTag({ id: 5 })
      vi.mocked(Tag.findOne).mockResolvedValue(mockTag as any)

      const result = await findTagById(5, 1)

      expect(result).toBeDefined()
      expect(Tag.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 5, tenantId: 1 }
        })
      )
    })

    it("throws AppError when not found", async () => {
      vi.mocked(Tag.findOne).mockResolvedValue(null)

      await expect(findTagById(999, 1)).rejects.toThrow(AppError)
      await expect(findTagById(999, 1)).rejects.toThrow("Tag not found")
    })
  })

  describe("createTag", () => {
    it("creates a tag successfully", async () => {
      vi.mocked(Tag.findOne).mockResolvedValue(null)

      const created = buildTag({ id: 10, name: "New Tag" })
      vi.mocked(Tag.create).mockResolvedValue(created as any)

      const result = await createTag(1, { name: "New Tag", color: "#ff0000" })

      expect(result).toBeDefined()
      expect(Tag.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          name: "New Tag",
          color: "#ff0000"
        })
      )
    })

    it("throws when name already exists", async () => {
      const existing = buildTag({ name: "VIP" })
      vi.mocked(Tag.findOne).mockResolvedValue(existing as any)

      await expect(
        createTag(1, { name: "VIP", color: "#ff0000" })
      ).rejects.toThrow("A tag with this name already exists")
    })
  })

  describe("updateTag", () => {
    it("updates a tag successfully", async () => {
      const mockTag = buildTag({ id: 1 })
      vi.mocked(Tag.findOne)
        .mockResolvedValueOnce(mockTag as any)
        .mockResolvedValueOnce(null)

      const result = await updateTag(1, 1, { name: "Updated Tag" })

      expect(result).toBeDefined()
      expect(mockTag.update).toHaveBeenCalledWith({ name: "Updated Tag" })
    })

    it("throws when not found", async () => {
      vi.mocked(Tag.findOne).mockResolvedValue(null)

      await expect(
        updateTag(999, 1, { name: "Updated" })
      ).rejects.toThrow("Tag not found")
    })

    it("throws when new name conflicts", async () => {
      const mockTag = buildTag({ id: 1 })
      const conflicting = buildTag({ id: 2, name: "Other" })

      vi.mocked(Tag.findOne)
        .mockResolvedValueOnce(mockTag as any)
        .mockResolvedValueOnce(conflicting as any)

      await expect(
        updateTag(1, 1, { name: "Other" })
      ).rejects.toThrow("A tag with this name already exists")
    })
  })

  describe("deleteTag", () => {
    it("deletes a tag and its contact associations", async () => {
      const mockTag = buildTag({ id: 1 })
      vi.mocked(Tag.findOne).mockResolvedValue(mockTag as any)

      await deleteTag(1, 1)

      expect(ContactTag.destroy).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tagId: 1 } })
      )
      expect(mockTag.destroy).toHaveBeenCalled()
    })

    it("throws when not found", async () => {
      vi.mocked(Tag.findOne).mockResolvedValue(null)

      await expect(deleteTag(999, 1)).rejects.toThrow("Tag not found")
    })
  })
})

import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/models/FastReply", () => ({
  default: {
    findOne: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn()
  }
}))

import {
  listFastReplies,
  findFastReplyById,
  createFastReply,
  updateFastReply,
  deleteFastReply
} from "../FastReplyService"
import FastReply from "@/models/FastReply"
import { AppError } from "@/helpers/AppError"

function buildFastReply(overrides: Record<string, unknown> = {}) {
  const data = {
    id: 1,
    tenantId: 1,
    userId: 1,
    key: "/hello",
    message: "Hello, how can I help?",
    mediaUrl: "",
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

describe("FastReplyService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listFastReplies", () => {
    it("returns fast replies for a tenant and user", async () => {
      const mockReplies = [
        buildFastReply({ id: 1, key: "/hello" }),
        buildFastReply({ id: 2, key: "/bye" })
      ]
      vi.mocked(FastReply.findAll).mockResolvedValue(mockReplies as any)

      const result = await listFastReplies({ tenantId: 1, userId: 1 })

      expect(result).toHaveLength(2)
      expect(FastReply.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 1, userId: 1 },
          order: [["key", "ASC"]]
        })
      )
    })

    it("filters by searchParam", async () => {
      vi.mocked(FastReply.findAll).mockResolvedValue([])

      await listFastReplies({ tenantId: 1, userId: 1, searchParam: "hello" })

      expect(FastReply.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 1,
            userId: 1
          })
        })
      )
    })
  })

  describe("findFastReplyById", () => {
    it("returns a fast reply when found", async () => {
      const mockReply = buildFastReply({ id: 5 })
      vi.mocked(FastReply.findOne).mockResolvedValue(mockReply as any)

      const result = await findFastReplyById(5, 1, 1)

      expect(result).toBeDefined()
      expect(FastReply.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 5, tenantId: 1, userId: 1 }
        })
      )
    })

    it("throws AppError when not found", async () => {
      vi.mocked(FastReply.findOne).mockResolvedValue(null)

      await expect(findFastReplyById(999, 1, 1)).rejects.toThrow(AppError)
      await expect(findFastReplyById(999, 1, 1)).rejects.toThrow("Fast reply not found")
    })
  })

  describe("createFastReply", () => {
    it("creates a fast reply successfully", async () => {
      vi.mocked(FastReply.findOne).mockResolvedValue(null)

      const created = buildFastReply({ id: 10, key: "/new" })
      vi.mocked(FastReply.create).mockResolvedValue(created as any)

      const result = await createFastReply(1, 1, {
        key: "/new",
        message: "New reply"
      })

      expect(result).toBeDefined()
      expect(FastReply.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          userId: 1,
          key: "/new",
          message: "New reply",
          mediaUrl: ""
        })
      )
    })

    it("throws when key already exists", async () => {
      const existing = buildFastReply({ key: "/hello" })
      vi.mocked(FastReply.findOne).mockResolvedValue(existing as any)

      await expect(
        createFastReply(1, 1, { key: "/hello", message: "Dup" })
      ).rejects.toThrow("A fast reply with this key already exists")
    })
  })

  describe("updateFastReply", () => {
    it("updates a fast reply successfully", async () => {
      const mockReply = buildFastReply({ id: 1 })
      vi.mocked(FastReply.findOne)
        .mockResolvedValueOnce(mockReply as any)

      const result = await updateFastReply(1, 1, 1, { message: "Updated message" })

      expect(result).toBeDefined()
      expect(mockReply.update).toHaveBeenCalledWith({ message: "Updated message" })
    })

    it("throws when not found", async () => {
      vi.mocked(FastReply.findOne).mockResolvedValue(null)

      await expect(
        updateFastReply(999, 1, 1, { message: "Updated" })
      ).rejects.toThrow("Fast reply not found")
    })

    it("throws when new key conflicts with existing", async () => {
      const mockReply = buildFastReply({ id: 1, key: "/hello" })
      const conflicting = buildFastReply({ id: 2, key: "/bye" })

      vi.mocked(FastReply.findOne)
        .mockResolvedValueOnce(mockReply as any)
        .mockResolvedValueOnce(conflicting as any)

      await expect(
        updateFastReply(1, 1, 1, { key: "/bye" })
      ).rejects.toThrow("A fast reply with this key already exists")
    })
  })

  describe("deleteFastReply", () => {
    it("deletes a fast reply successfully", async () => {
      const mockReply = buildFastReply({ id: 1 })
      vi.mocked(FastReply.findOne).mockResolvedValue(mockReply as any)

      await deleteFastReply(1, 1, 1)

      expect(mockReply.destroy).toHaveBeenCalled()
    })

    it("throws when not found", async () => {
      vi.mocked(FastReply.findOne).mockResolvedValue(null)

      await expect(deleteFastReply(999, 1, 1)).rejects.toThrow("Fast reply not found")
    })
  })
})

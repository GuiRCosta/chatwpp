import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/models/AutoReply", () => ({
  default: {
    findOne: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn()
  }
}))

vi.mock("@/models/AutoReplyStep", () => ({
  default: {
    findOne: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn()
  }
}))

import {
  listAutoReplies,
  findAutoReplyById,
  createAutoReply,
  updateAutoReply,
  deleteAutoReply,
  createStep,
  updateStep,
  deleteStep
} from "../AutoReplyService"
import AutoReply from "@/models/AutoReply"
import AutoReplyStep from "@/models/AutoReplyStep"
import { AppError } from "@/helpers/AppError"

function buildAutoReply(overrides: Record<string, unknown> = {}) {
  const data = {
    id: 1,
    tenantId: 1,
    userId: 1,
    name: "Test Auto Reply",
    action: "reply",
    isActive: true,
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

function buildAutoReplyStep(overrides: Record<string, unknown> = {}) {
  const data = {
    id: 1,
    autoReplyId: 1,
    stepOrder: 1,
    message: "Hello!",
    mediaUrl: "",
    action: null,
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

describe("AutoReplyService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listAutoReplies", () => {
    it("returns auto replies for a tenant", async () => {
      const mockReplies = [
        buildAutoReply({ id: 1, name: "Reply A" }),
        buildAutoReply({ id: 2, name: "Reply B" })
      ]
      vi.mocked(AutoReply.findAll).mockResolvedValue(mockReplies as any)

      const result = await listAutoReplies({ tenantId: 1 })

      expect(result).toHaveLength(2)
      expect(AutoReply.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 1 },
          order: [["name", "ASC"]]
        })
      )
    })

    it("filters by searchParam", async () => {
      vi.mocked(AutoReply.findAll).mockResolvedValue([])

      await listAutoReplies({ tenantId: 1, searchParam: "greet" })

      expect(AutoReply.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 1,
            name: expect.any(Object)
          })
        })
      )
    })

    it("filters by isActive", async () => {
      vi.mocked(AutoReply.findAll).mockResolvedValue([])

      await listAutoReplies({ tenantId: 1, isActive: true })

      expect(AutoReply.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 1,
            isActive: true
          })
        })
      )
    })
  })

  describe("findAutoReplyById", () => {
    it("returns auto reply when found", async () => {
      const mockReply = buildAutoReply({ id: 5 })
      vi.mocked(AutoReply.findOne).mockResolvedValue(mockReply as any)

      const result = await findAutoReplyById(5, 1)

      expect(result).toBeDefined()
      expect(AutoReply.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 5, tenantId: 1 }
        })
      )
    })

    it("throws AppError when not found", async () => {
      vi.mocked(AutoReply.findOne).mockResolvedValue(null)

      await expect(findAutoReplyById(999, 1)).rejects.toThrow(AppError)
      await expect(findAutoReplyById(999, 1)).rejects.toThrow("Auto reply not found")
    })
  })

  describe("createAutoReply", () => {
    it("creates an auto reply successfully", async () => {
      const created = buildAutoReply({ id: 10, name: "New Reply" })
      vi.mocked(AutoReply.create).mockResolvedValue(created as any)

      const result = await createAutoReply(1, 1, {
        name: "New Reply",
        action: "reply"
      })

      expect(result).toBeDefined()
      expect(AutoReply.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          userId: 1,
          name: "New Reply",
          action: "reply",
          isActive: true
        })
      )
    })

    it("respects isActive when explicitly set to false", async () => {
      const created = buildAutoReply({ isActive: false })
      vi.mocked(AutoReply.create).mockResolvedValue(created as any)

      await createAutoReply(1, 1, {
        name: "Inactive Reply",
        action: "reply",
        isActive: false
      })

      expect(AutoReply.create).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false })
      )
    })
  })

  describe("updateAutoReply", () => {
    it("updates an auto reply successfully", async () => {
      const mockReply = buildAutoReply({ id: 1 })
      vi.mocked(AutoReply.findOne).mockResolvedValue(mockReply as any)

      const result = await updateAutoReply(1, 1, { name: "Updated Reply" })

      expect(result).toBeDefined()
      expect(mockReply.update).toHaveBeenCalledWith({ name: "Updated Reply" })
    })

    it("throws AppError when not found", async () => {
      vi.mocked(AutoReply.findOne).mockResolvedValue(null)

      await expect(
        updateAutoReply(999, 1, { name: "Updated" })
      ).rejects.toThrow("Auto reply not found")
    })
  })

  describe("deleteAutoReply", () => {
    it("deletes an auto reply successfully", async () => {
      const mockReply = buildAutoReply({ id: 1 })
      vi.mocked(AutoReply.findOne).mockResolvedValue(mockReply as any)

      await deleteAutoReply(1, 1)

      expect(mockReply.destroy).toHaveBeenCalled()
    })

    it("throws AppError when not found", async () => {
      vi.mocked(AutoReply.findOne).mockResolvedValue(null)

      await expect(deleteAutoReply(999, 1)).rejects.toThrow("Auto reply not found")
    })
  })

  describe("createStep", () => {
    it("creates a step successfully", async () => {
      const mockReply = buildAutoReply({ id: 1 })
      vi.mocked(AutoReply.findOne).mockResolvedValue(mockReply as any)
      vi.mocked(AutoReplyStep.findOne).mockResolvedValue(null)

      const createdStep = buildAutoReplyStep({ id: 10, autoReplyId: 1 })
      vi.mocked(AutoReplyStep.create).mockResolvedValue(createdStep as any)

      const result = await createStep(1, 1, {
        stepOrder: 1,
        message: "Hello!"
      })

      expect(result).toBeDefined()
      expect(AutoReplyStep.create).toHaveBeenCalledWith(
        expect.objectContaining({
          autoReplyId: 1,
          stepOrder: 1,
          message: "Hello!"
        })
      )
    })

    it("throws when auto reply not found", async () => {
      vi.mocked(AutoReply.findOne).mockResolvedValue(null)

      await expect(
        createStep(999, 1, { stepOrder: 1, message: "Hello!" })
      ).rejects.toThrow("Auto reply not found")
    })

    it("throws when step order already exists", async () => {
      const mockReply = buildAutoReply({ id: 1 })
      const existingStep = buildAutoReplyStep({ stepOrder: 1 })
      vi.mocked(AutoReply.findOne).mockResolvedValue(mockReply as any)
      vi.mocked(AutoReplyStep.findOne).mockResolvedValue(existingStep as any)

      await expect(
        createStep(1, 1, { stepOrder: 1, message: "Hello!" })
      ).rejects.toThrow("A step with this order already exists")
    })
  })

  describe("updateStep", () => {
    it("updates a step successfully", async () => {
      const mockReply = buildAutoReply({ id: 1 })
      const mockStep = buildAutoReplyStep({ id: 1, stepOrder: 1 })

      vi.mocked(AutoReply.findOne).mockResolvedValue(mockReply as any)
      vi.mocked(AutoReplyStep.findOne)
        .mockResolvedValueOnce(mockStep as any)

      const result = await updateStep(1, 1, 1, { message: "Updated message" })

      expect(result).toBeDefined()
      expect(mockStep.update).toHaveBeenCalledWith({ message: "Updated message" })
    })

    it("throws when auto reply not found", async () => {
      vi.mocked(AutoReply.findOne).mockResolvedValue(null)

      await expect(
        updateStep(999, 1, 1, { message: "Updated" })
      ).rejects.toThrow("Auto reply not found")
    })

    it("throws when step not found", async () => {
      const mockReply = buildAutoReply({ id: 1 })
      vi.mocked(AutoReply.findOne).mockResolvedValue(mockReply as any)
      vi.mocked(AutoReplyStep.findOne).mockResolvedValue(null)

      await expect(
        updateStep(1, 999, 1, { message: "Updated" })
      ).rejects.toThrow("Step not found")
    })

    it("throws when new step order conflicts", async () => {
      const mockReply = buildAutoReply({ id: 1 })
      const mockStep = buildAutoReplyStep({ id: 1, stepOrder: 1 })
      const conflictStep = buildAutoReplyStep({ id: 2, stepOrder: 2 })

      vi.mocked(AutoReply.findOne).mockResolvedValue(mockReply as any)
      vi.mocked(AutoReplyStep.findOne)
        .mockResolvedValueOnce(mockStep as any)
        .mockResolvedValueOnce(conflictStep as any)

      await expect(
        updateStep(1, 1, 1, { stepOrder: 2 })
      ).rejects.toThrow("A step with this order already exists")
    })
  })

  describe("deleteStep", () => {
    it("deletes a step and reorders remaining steps", async () => {
      const mockReply = buildAutoReply({ id: 1 })
      const mockStep = buildAutoReplyStep({ id: 1, stepOrder: 1 })
      const remainingStep = buildAutoReplyStep({ id: 2, stepOrder: 2 })

      vi.mocked(AutoReply.findOne).mockResolvedValue(mockReply as any)
      vi.mocked(AutoReplyStep.findOne).mockResolvedValue(mockStep as any)
      vi.mocked(AutoReplyStep.findAll).mockResolvedValue([remainingStep] as any)

      await deleteStep(1, 1, 1)

      expect(mockStep.destroy).toHaveBeenCalled()
      expect(remainingStep.update).toHaveBeenCalledWith({ stepOrder: 1 })
    })

    it("throws when auto reply not found", async () => {
      vi.mocked(AutoReply.findOne).mockResolvedValue(null)

      await expect(deleteStep(999, 1, 1)).rejects.toThrow("Auto reply not found")
    })

    it("throws when step not found", async () => {
      const mockReply = buildAutoReply({ id: 1 })
      vi.mocked(AutoReply.findOne).mockResolvedValue(mockReply as any)
      vi.mocked(AutoReplyStep.findOne).mockResolvedValue(null)

      await expect(deleteStep(1, 999, 1)).rejects.toThrow("Step not found")
    })
  })
})

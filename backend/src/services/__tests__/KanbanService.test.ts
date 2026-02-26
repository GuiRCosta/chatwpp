import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/models/Kanban", () => ({
  default: {
    findOne: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn()
  }
}))

vi.mock("@/models/Stage", () => ({
  default: {
    findOne: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn()
  }
}))

vi.mock("@/models/Opportunity", () => ({
  default: {
    count: vi.fn()
  }
}))

import {
  listKanbans,
  findKanbanById,
  createKanban,
  updateKanban,
  deleteKanban,
  createStage,
  updateStage,
  deleteStage,
  reorderStages
} from "../KanbanService"
import Kanban from "@/models/Kanban"
import Stage from "@/models/Stage"
import Opportunity from "@/models/Opportunity"
import { AppError } from "@/helpers/AppError"

function buildKanban(overrides: Record<string, unknown> = {}) {
  const data = {
    id: 1,
    tenantId: 1,
    name: "Test Kanban",
    isActive: true,
    stages: [],
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

function buildStageObj(overrides: Record<string, unknown> = {}) {
  const data = {
    id: 1,
    kanbanId: 1,
    name: "Test Stage",
    order: 1,
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

describe("KanbanService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listKanbans", () => {
    it("returns kanbans for a tenant", async () => {
      const mockKanbans = [
        buildKanban({ id: 1, name: "Board A" }),
        buildKanban({ id: 2, name: "Board B" })
      ]
      vi.mocked(Kanban.findAll).mockResolvedValue(mockKanbans as any)

      const result = await listKanbans({ tenantId: 1 })

      expect(result).toHaveLength(2)
      expect(Kanban.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 1 },
          order: [["name", "ASC"]]
        })
      )
    })

    it("filters by searchParam", async () => {
      vi.mocked(Kanban.findAll).mockResolvedValue([])

      await listKanbans({ tenantId: 1, searchParam: "sales" })

      expect(Kanban.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 1,
            name: expect.any(Object)
          })
        })
      )
    })
  })

  describe("findKanbanById", () => {
    it("returns a kanban when found", async () => {
      const mockKanban = buildKanban({ id: 5 })
      vi.mocked(Kanban.findOne).mockResolvedValue(mockKanban as any)

      const result = await findKanbanById(5, 1)

      expect(result).toBeDefined()
      expect(Kanban.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 5, tenantId: 1 }
        })
      )
    })

    it("throws AppError when not found", async () => {
      vi.mocked(Kanban.findOne).mockResolvedValue(null)

      await expect(findKanbanById(999, 1)).rejects.toThrow(AppError)
      await expect(findKanbanById(999, 1)).rejects.toThrow("Kanban not found")
    })
  })

  describe("createKanban", () => {
    it("creates a kanban successfully", async () => {
      vi.mocked(Kanban.findOne).mockResolvedValue(null)

      const created = buildKanban({ id: 10, name: "New Board" })
      vi.mocked(Kanban.create).mockResolvedValue(created as any)

      const result = await createKanban(1, { name: "New Board" })

      expect(result).toBeDefined()
      expect(Kanban.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          name: "New Board",
          isActive: true
        })
      )
    })

    it("throws when name already exists", async () => {
      const existing = buildKanban({ name: "Sales" })
      vi.mocked(Kanban.findOne).mockResolvedValue(existing as any)

      await expect(
        createKanban(1, { name: "Sales" })
      ).rejects.toThrow("A kanban with this name already exists")
    })
  })

  describe("updateKanban", () => {
    it("updates a kanban successfully", async () => {
      const mockKanban = buildKanban({ id: 1 })
      vi.mocked(Kanban.findOne)
        .mockResolvedValueOnce(mockKanban as any)
        .mockResolvedValueOnce(null)

      const result = await updateKanban(1, 1, { name: "Updated Board" })

      expect(result).toBeDefined()
      expect(mockKanban.update).toHaveBeenCalledWith({ name: "Updated Board" })
    })

    it("throws when not found", async () => {
      vi.mocked(Kanban.findOne).mockResolvedValue(null)

      await expect(
        updateKanban(999, 1, { name: "Updated" })
      ).rejects.toThrow("Kanban not found")
    })

    it("throws when new name conflicts", async () => {
      const mockKanban = buildKanban({ id: 1 })
      const conflicting = buildKanban({ id: 2, name: "Other" })

      vi.mocked(Kanban.findOne)
        .mockResolvedValueOnce(mockKanban as any)
        .mockResolvedValueOnce(conflicting as any)

      await expect(
        updateKanban(1, 1, { name: "Other" })
      ).rejects.toThrow("A kanban with this name already exists")
    })
  })

  describe("deleteKanban", () => {
    it("deletes a kanban with no stages", async () => {
      const mockKanban = buildKanban({ id: 1, stages: [] })
      vi.mocked(Kanban.findOne).mockResolvedValue(mockKanban as any)

      await deleteKanban(1, 1)

      expect(mockKanban.destroy).toHaveBeenCalled()
    })

    it("deletes a kanban with empty stages", async () => {
      const mockStage = buildStageObj({ id: 10 })
      const mockKanban = buildKanban({ id: 1, stages: [mockStage] })
      vi.mocked(Kanban.findOne).mockResolvedValue(mockKanban as any)
      vi.mocked(Opportunity.count).mockResolvedValue(0)

      await deleteKanban(1, 1)

      expect(Stage.destroy).toHaveBeenCalledWith(
        expect.objectContaining({ where: { kanbanId: 1 } })
      )
      expect(mockKanban.destroy).toHaveBeenCalled()
    })

    it("throws when not found", async () => {
      vi.mocked(Kanban.findOne).mockResolvedValue(null)

      await expect(deleteKanban(999, 1)).rejects.toThrow("Kanban not found")
    })

    it("throws when stages have opportunities", async () => {
      const mockStage = buildStageObj({ id: 10 })
      const mockKanban = buildKanban({ id: 1, stages: [mockStage] })
      vi.mocked(Kanban.findOne).mockResolvedValue(mockKanban as any)
      vi.mocked(Opportunity.count).mockResolvedValue(5)

      await expect(deleteKanban(1, 1)).rejects.toThrow(
        "Cannot delete kanban with stages that have opportunities"
      )
    })
  })

  describe("createStage", () => {
    it("creates a stage successfully", async () => {
      const mockKanban = buildKanban({ id: 1 })
      vi.mocked(Kanban.findOne).mockResolvedValue(mockKanban as any)

      const created = buildStageObj({ id: 10, kanbanId: 1 })
      vi.mocked(Stage.create).mockResolvedValue(created as any)

      const result = await createStage(1, 1, { name: "New Stage", order: 1 })

      expect(result).toBeDefined()
      expect(Stage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          kanbanId: 1,
          name: "New Stage",
          order: 1
        })
      )
    })

    it("throws when kanban not found", async () => {
      vi.mocked(Kanban.findOne).mockResolvedValue(null)

      await expect(
        createStage(999, 1, { name: "Stage", order: 1 })
      ).rejects.toThrow("Kanban not found")
    })
  })

  describe("updateStage", () => {
    it("updates a stage successfully", async () => {
      const mockKanban = buildKanban({ id: 1 })
      const mockStage = buildStageObj({ id: 1 })

      vi.mocked(Kanban.findOne).mockResolvedValue(mockKanban as any)
      vi.mocked(Stage.findOne).mockResolvedValue(mockStage as any)

      const result = await updateStage(1, 1, 1, { name: "Updated Stage" })

      expect(result).toBeDefined()
      expect(mockStage.update).toHaveBeenCalledWith({ name: "Updated Stage" })
    })

    it("throws when kanban not found", async () => {
      vi.mocked(Kanban.findOne).mockResolvedValue(null)

      await expect(
        updateStage(999, 1, 1, { name: "Updated" })
      ).rejects.toThrow("Kanban not found")
    })

    it("throws when stage not found", async () => {
      const mockKanban = buildKanban({ id: 1 })
      vi.mocked(Kanban.findOne).mockResolvedValue(mockKanban as any)
      vi.mocked(Stage.findOne).mockResolvedValue(null)

      await expect(
        updateStage(1, 999, 1, { name: "Updated" })
      ).rejects.toThrow("Stage not found")
    })
  })

  describe("deleteStage", () => {
    it("deletes a stage successfully", async () => {
      const mockKanban = buildKanban({ id: 1 })
      const mockStage = buildStageObj({ id: 1 })

      vi.mocked(Kanban.findOne).mockResolvedValue(mockKanban as any)
      vi.mocked(Stage.findOne).mockResolvedValue(mockStage as any)
      vi.mocked(Opportunity.count).mockResolvedValue(0)

      await deleteStage(1, 1, 1)

      expect(mockStage.destroy).toHaveBeenCalled()
    })

    it("throws when kanban not found", async () => {
      vi.mocked(Kanban.findOne).mockResolvedValue(null)

      await expect(deleteStage(999, 1, 1)).rejects.toThrow("Kanban not found")
    })

    it("throws when stage not found", async () => {
      const mockKanban = buildKanban({ id: 1 })
      vi.mocked(Kanban.findOne).mockResolvedValue(mockKanban as any)
      vi.mocked(Stage.findOne).mockResolvedValue(null)

      await expect(deleteStage(1, 999, 1)).rejects.toThrow("Stage not found")
    })

    it("throws when stage has opportunities", async () => {
      const mockKanban = buildKanban({ id: 1 })
      const mockStage = buildStageObj({ id: 1 })

      vi.mocked(Kanban.findOne).mockResolvedValue(mockKanban as any)
      vi.mocked(Stage.findOne).mockResolvedValue(mockStage as any)
      vi.mocked(Opportunity.count).mockResolvedValue(3)

      await expect(deleteStage(1, 1, 1)).rejects.toThrow(
        "Cannot delete stage with existing opportunities"
      )
    })
  })

  describe("reorderStages", () => {
    it("reorders stages successfully", async () => {
      const mockKanban = buildKanban({ id: 1 })
      vi.mocked(Kanban.findOne).mockResolvedValue(mockKanban as any)

      const stages = [
        buildStageObj({ id: 1 }),
        buildStageObj({ id: 2 })
      ]
      vi.mocked(Stage.findAll)
        .mockResolvedValueOnce(stages as any)
        .mockResolvedValueOnce(stages as any)
      vi.mocked(Stage.update).mockResolvedValue([1] as any)

      const result = await reorderStages(1, 1, {
        stages: [
          { id: 1, order: 2 },
          { id: 2, order: 1 }
        ]
      })

      expect(result).toHaveLength(2)
      expect(Stage.update).toHaveBeenCalledTimes(2)
    })

    it("throws when kanban not found", async () => {
      vi.mocked(Kanban.findOne).mockResolvedValue(null)

      await expect(
        reorderStages(999, 1, { stages: [{ id: 1, order: 1 }] })
      ).rejects.toThrow("Kanban not found")
    })

    it("throws when stages count mismatch", async () => {
      const mockKanban = buildKanban({ id: 1 })
      vi.mocked(Kanban.findOne).mockResolvedValue(mockKanban as any)
      vi.mocked(Stage.findAll).mockResolvedValue([])

      await expect(
        reorderStages(1, 1, { stages: [{ id: 1, order: 1 }] })
      ).rejects.toThrow("One or more stages not found")
    })
  })
})

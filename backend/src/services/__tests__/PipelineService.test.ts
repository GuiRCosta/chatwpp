import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/models/Pipeline", () => {
  const mockSequelize = {
    fn: vi.fn().mockReturnValue("COUNT_FN"),
    col: vi.fn().mockReturnValue("COL_REF")
  }
  return {
    default: {
      findOne: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      sequelize: mockSequelize
    }
  }
})

vi.mock("@/models/Opportunity", () => ({
  default: {
    count: vi.fn()
  }
}))

import {
  listPipelines,
  findPipelineById,
  createPipeline,
  updatePipeline,
  deletePipeline
} from "../PipelineService"
import Pipeline from "@/models/Pipeline"
import Opportunity from "@/models/Opportunity"
import { buildPipeline } from "@/__tests__/factories"
import { AppError } from "@/helpers/AppError"

describe("PipelineService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listPipelines", () => {
    it("returns pipelines for a tenant", async () => {
      const mockPipelines = [
        buildPipeline({ id: 1, name: "Pipeline A" }),
        buildPipeline({ id: 2, name: "Pipeline B" })
      ]
      vi.mocked(Pipeline.findAll).mockResolvedValue(mockPipelines as any)

      const result = await listPipelines({ tenantId: 1 })

      expect(result).toHaveLength(2)
      expect(Pipeline.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 1 },
          order: [["name", "ASC"]]
        })
      )
    })

    it("filters by searchParam", async () => {
      vi.mocked(Pipeline.findAll).mockResolvedValue([])

      await listPipelines({ tenantId: 1, searchParam: "sales" })

      expect(Pipeline.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 1,
            name: expect.any(Object)
          })
        })
      )
    })
  })

  describe("findPipelineById", () => {
    it("returns a pipeline when found", async () => {
      const mockPipeline = buildPipeline({ id: 5 })
      vi.mocked(Pipeline.findOne).mockResolvedValue(mockPipeline as any)

      const result = await findPipelineById(5, 1)

      expect(result).toBeDefined()
      expect(Pipeline.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 5, tenantId: 1 }
        })
      )
    })

    it("throws AppError when not found", async () => {
      vi.mocked(Pipeline.findOne).mockResolvedValue(null)

      await expect(findPipelineById(999, 1)).rejects.toThrow(AppError)
      await expect(findPipelineById(999, 1)).rejects.toThrow("Pipeline not found")
    })
  })

  describe("createPipeline", () => {
    it("creates a pipeline successfully", async () => {
      vi.mocked(Pipeline.findOne).mockResolvedValue(null)

      const created = buildPipeline({ id: 10, name: "New Pipeline" })
      vi.mocked(Pipeline.create).mockResolvedValue(created as any)

      const result = await createPipeline(1, { name: "New Pipeline" })

      expect(result).toBeDefined()
      expect(Pipeline.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          name: "New Pipeline"
        })
      )
    })

    it("throws when name already exists", async () => {
      const existing = buildPipeline({ name: "Sales" })
      vi.mocked(Pipeline.findOne).mockResolvedValue(existing as any)

      await expect(
        createPipeline(1, { name: "Sales" })
      ).rejects.toThrow("A pipeline with this name already exists")
    })
  })

  describe("updatePipeline", () => {
    it("updates a pipeline successfully", async () => {
      const mockPipeline = buildPipeline({ id: 1 })
      vi.mocked(Pipeline.findOne)
        .mockResolvedValueOnce(mockPipeline as any)
        .mockResolvedValueOnce(null)

      const result = await updatePipeline(1, 1, { name: "Updated Pipeline" })

      expect(result).toBeDefined()
      expect(mockPipeline.update).toHaveBeenCalledWith({ name: "Updated Pipeline" })
    })

    it("throws when not found", async () => {
      vi.mocked(Pipeline.findOne).mockResolvedValue(null)

      await expect(
        updatePipeline(999, 1, { name: "Updated" })
      ).rejects.toThrow("Pipeline not found")
    })

    it("throws when new name conflicts", async () => {
      const mockPipeline = buildPipeline({ id: 1 })
      const conflicting = buildPipeline({ id: 2, name: "Other" })

      vi.mocked(Pipeline.findOne)
        .mockResolvedValueOnce(mockPipeline as any)
        .mockResolvedValueOnce(conflicting as any)

      await expect(
        updatePipeline(1, 1, { name: "Other" })
      ).rejects.toThrow("A pipeline with this name already exists")
    })
  })

  describe("deletePipeline", () => {
    it("deletes a pipeline successfully", async () => {
      const mockPipeline = buildPipeline({ id: 1 })
      vi.mocked(Pipeline.findOne).mockResolvedValue(mockPipeline as any)
      vi.mocked(Opportunity.count).mockResolvedValue(0)

      await deletePipeline(1, 1)

      expect(mockPipeline.destroy).toHaveBeenCalled()
    })

    it("throws when not found", async () => {
      vi.mocked(Pipeline.findOne).mockResolvedValue(null)

      await expect(deletePipeline(999, 1)).rejects.toThrow("Pipeline not found")
    })

    it("throws when pipeline has opportunities", async () => {
      const mockPipeline = buildPipeline({ id: 1 })
      vi.mocked(Pipeline.findOne).mockResolvedValue(mockPipeline as any)
      vi.mocked(Opportunity.count).mockResolvedValue(5)

      await expect(deletePipeline(1, 1)).rejects.toThrow(
        "Cannot delete pipeline with existing opportunities"
      )
    })
  })
})

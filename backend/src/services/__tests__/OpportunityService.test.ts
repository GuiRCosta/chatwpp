import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/models/Opportunity", () => ({
  default: {
    findOne: vi.fn(),
    findAndCountAll: vi.fn(),
    create: vi.fn()
  }
}))

vi.mock("@/models/Contact", () => ({
  default: {
    findOne: vi.fn()
  }
}))

vi.mock("@/models/Pipeline", () => ({
  default: {
    findOne: vi.fn()
  }
}))

vi.mock("@/models/Stage", () => ({
  default: {
    findOne: vi.fn()
  }
}))

import {
  listOpportunities,
  findOpportunityById,
  createOpportunity,
  updateOpportunity,
  moveOpportunity,
  deleteOpportunity
} from "../OpportunityService"
import Opportunity from "@/models/Opportunity"
import Contact from "@/models/Contact"
import Pipeline from "@/models/Pipeline"
import Stage from "@/models/Stage"
import { buildOpportunity, buildContact, buildPipeline, buildStage } from "@/__tests__/factories"
import { AppError } from "@/helpers/AppError"

describe("OpportunityService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listOpportunities", () => {
    it("returns paginated opportunities", async () => {
      const mockOpps = [
        buildOpportunity({ id: 1 }),
        buildOpportunity({ id: 2 })
      ]
      vi.mocked(Opportunity.findAndCountAll).mockResolvedValue({
        rows: mockOpps,
        count: 2
      } as any)

      const result = await listOpportunities({ tenantId: 1 })

      expect(result.opportunities).toHaveLength(2)
      expect(result.count).toBe(2)
      expect(result.hasMore).toBe(false)
    })

    it("filters by pipelineId", async () => {
      vi.mocked(Opportunity.findAndCountAll).mockResolvedValue({
        rows: [],
        count: 0
      } as any)

      await listOpportunities({ tenantId: 1, pipelineId: 5 })

      expect(Opportunity.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 1,
            pipelineId: 5
          })
        })
      )
    })

    it("filters by stageId", async () => {
      vi.mocked(Opportunity.findAndCountAll).mockResolvedValue({
        rows: [],
        count: 0
      } as any)

      await listOpportunities({ tenantId: 1, stageId: 3 })

      expect(Opportunity.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 1,
            stageId: 3
          })
        })
      )
    })

    it("filters by status", async () => {
      vi.mocked(Opportunity.findAndCountAll).mockResolvedValue({
        rows: [],
        count: 0
      } as any)

      await listOpportunities({ tenantId: 1, status: "won" })

      expect(Opportunity.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 1,
            status: "won"
          })
        })
      )
    })

    it("returns hasMore when more results exist", async () => {
      vi.mocked(Opportunity.findAndCountAll).mockResolvedValue({
        rows: [buildOpportunity({ id: 1 })],
        count: 50
      } as any)

      const result = await listOpportunities({ tenantId: 1, pageNumber: "1", limit: "20" })

      expect(result.hasMore).toBe(true)
    })
  })

  describe("findOpportunityById", () => {
    it("returns an opportunity when found", async () => {
      const mockOpp = buildOpportunity({ id: 5 })
      vi.mocked(Opportunity.findOne).mockResolvedValue(mockOpp as any)

      const result = await findOpportunityById(5, 1)

      expect(result).toBeDefined()
      expect(Opportunity.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 5, tenantId: 1 }
        })
      )
    })

    it("throws AppError when not found", async () => {
      vi.mocked(Opportunity.findOne).mockResolvedValue(null)

      await expect(findOpportunityById(999, 1)).rejects.toThrow(AppError)
      await expect(findOpportunityById(999, 1)).rejects.toThrow("Opportunity not found")
    })
  })

  describe("createOpportunity", () => {
    it("creates an opportunity successfully", async () => {
      const mockContact = buildContact({ id: 1 })
      const mockPipeline = buildPipeline({ id: 1 })
      const mockStage = buildStage({ id: 1 })
      const created = buildOpportunity({ id: 10 })

      vi.mocked(Contact.findOne).mockResolvedValue(mockContact as any)
      vi.mocked(Pipeline.findOne).mockResolvedValue(mockPipeline as any)
      vi.mocked(Stage.findOne).mockResolvedValue(mockStage as any)
      vi.mocked(Opportunity.create).mockResolvedValue(created as any)
      vi.mocked(Opportunity.findOne).mockResolvedValue(created as any)

      const result = await createOpportunity(1, {
        contactId: 1,
        pipelineId: 1,
        stageId: 1,
        value: 500
      })

      expect(result).toBeDefined()
      expect(Opportunity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          contactId: 1,
          pipelineId: 1,
          stageId: 1,
          value: 500,
          status: "open"
        })
      )
    })

    it("throws when contact not found", async () => {
      vi.mocked(Contact.findOne).mockResolvedValue(null)

      await expect(
        createOpportunity(1, { contactId: 999, pipelineId: 1, stageId: 1 })
      ).rejects.toThrow("Contact not found")
    })

    it("throws when pipeline not found", async () => {
      const mockContact = buildContact({ id: 1 })
      vi.mocked(Contact.findOne).mockResolvedValue(mockContact as any)
      vi.mocked(Pipeline.findOne).mockResolvedValue(null)

      await expect(
        createOpportunity(1, { contactId: 1, pipelineId: 999, stageId: 1 })
      ).rejects.toThrow("Pipeline not found")
    })

    it("throws when stage not found", async () => {
      const mockContact = buildContact({ id: 1 })
      const mockPipeline = buildPipeline({ id: 1 })
      vi.mocked(Contact.findOne).mockResolvedValue(mockContact as any)
      vi.mocked(Pipeline.findOne).mockResolvedValue(mockPipeline as any)
      vi.mocked(Stage.findOne).mockResolvedValue(null)

      await expect(
        createOpportunity(1, { contactId: 1, pipelineId: 1, stageId: 999 })
      ).rejects.toThrow("Stage not found or does not belong to the specified pipeline")
    })
  })

  describe("updateOpportunity", () => {
    it("updates an opportunity successfully", async () => {
      const mockOpp = buildOpportunity({ id: 1, pipelineId: 1 })
      vi.mocked(Opportunity.findOne)
        .mockResolvedValueOnce(mockOpp as any)
        .mockResolvedValueOnce(mockOpp as any)

      const result = await updateOpportunity(1, 1, { value: 2000 })

      expect(result).toBeDefined()
      expect(mockOpp.update).toHaveBeenCalledWith({ value: 2000 })
    })

    it("throws when opportunity not found", async () => {
      vi.mocked(Opportunity.findOne).mockResolvedValue(null)

      await expect(
        updateOpportunity(999, 1, { value: 100 })
      ).rejects.toThrow("Opportunity not found")
    })

    it("validates contact when contactId provided", async () => {
      const mockOpp = buildOpportunity({ id: 1 })
      vi.mocked(Opportunity.findOne)
        .mockResolvedValueOnce(mockOpp as any)
        .mockResolvedValueOnce(mockOpp as any)
      vi.mocked(Contact.findOne).mockResolvedValue(null)

      await expect(
        updateOpportunity(1, 1, { contactId: 999 })
      ).rejects.toThrow("Contact not found")
    })

    it("validates pipeline when pipelineId provided", async () => {
      const mockOpp = buildOpportunity({ id: 1 })
      vi.mocked(Opportunity.findOne).mockResolvedValueOnce(mockOpp as any)
      vi.mocked(Pipeline.findOne).mockResolvedValue(null)

      await expect(
        updateOpportunity(1, 1, { pipelineId: 999 })
      ).rejects.toThrow("Pipeline not found")
    })

    it("validates stage when stageId provided", async () => {
      const mockOpp = buildOpportunity({ id: 1, pipelineId: 1 })
      vi.mocked(Opportunity.findOne).mockResolvedValueOnce(mockOpp as any)
      vi.mocked(Stage.findOne).mockResolvedValue(null)

      await expect(
        updateOpportunity(1, 1, { stageId: 999 })
      ).rejects.toThrow("Stage not found or does not belong to the specified pipeline")
    })
  })

  describe("moveOpportunity", () => {
    it("moves an opportunity to a new stage", async () => {
      const mockOpp = buildOpportunity({ id: 1, pipelineId: 1 })
      const mockStage = buildStage({ id: 2 })

      vi.mocked(Opportunity.findOne)
        .mockResolvedValueOnce(mockOpp as any)
        .mockResolvedValueOnce(mockOpp as any)
      vi.mocked(Stage.findOne).mockResolvedValue(mockStage as any)

      const result = await moveOpportunity(1, 1, 2)

      expect(result).toBeDefined()
      expect(mockOpp.update).toHaveBeenCalledWith({ stageId: 2 })
    })

    it("throws when opportunity not found", async () => {
      vi.mocked(Opportunity.findOne).mockResolvedValue(null)

      await expect(moveOpportunity(999, 1, 2)).rejects.toThrow("Opportunity not found")
    })

    it("throws when stage not found or wrong pipeline", async () => {
      const mockOpp = buildOpportunity({ id: 1, pipelineId: 1 })
      vi.mocked(Opportunity.findOne).mockResolvedValue(mockOpp as any)
      vi.mocked(Stage.findOne).mockResolvedValue(null)

      await expect(moveOpportunity(1, 1, 999)).rejects.toThrow(
        "Stage not found or does not belong to the opportunity's pipeline"
      )
    })
  })

  describe("deleteOpportunity", () => {
    it("deletes an opportunity successfully", async () => {
      const mockOpp = buildOpportunity({ id: 1 })
      vi.mocked(Opportunity.findOne).mockResolvedValue(mockOpp as any)

      await deleteOpportunity(1, 1)

      expect(mockOpp.destroy).toHaveBeenCalled()
    })

    it("throws when opportunity not found", async () => {
      vi.mocked(Opportunity.findOne).mockResolvedValue(null)

      await expect(deleteOpportunity(999, 1)).rejects.toThrow("Opportunity not found")
    })
  })
})

import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/models/ChatFlow", () => ({
  default: {
    findOne: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn()
  }
}))

vi.mock("@/models/Ticket", () => ({
  default: {
    count: vi.fn()
  }
}))

import {
  listChatFlows,
  findChatFlowById,
  createChatFlow,
  updateChatFlow,
  deleteChatFlow,
  duplicateChatFlow
} from "../ChatFlowService"
import ChatFlow from "@/models/ChatFlow"
import Ticket from "@/models/Ticket"
import { AppError } from "@/helpers/AppError"

function buildChatFlow(overrides: Record<string, unknown> = {}) {
  const data = {
    id: 1,
    tenantId: 1,
    name: "Test Chat Flow",
    flow: { nodes: [], edges: [] },
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

describe("ChatFlowService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listChatFlows", () => {
    it("returns chat flows for a tenant", async () => {
      const mockFlows = [
        buildChatFlow({ id: 1, name: "Flow A" }),
        buildChatFlow({ id: 2, name: "Flow B" })
      ]
      vi.mocked(ChatFlow.findAll).mockResolvedValue(mockFlows as any)

      const result = await listChatFlows({ tenantId: 1 })

      expect(result).toHaveLength(2)
      expect(ChatFlow.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 1 },
          order: [["name", "ASC"]]
        })
      )
    })

    it("filters by searchParam", async () => {
      vi.mocked(ChatFlow.findAll).mockResolvedValue([])

      await listChatFlows({ tenantId: 1, searchParam: "welcome" })

      expect(ChatFlow.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 1,
            name: expect.any(Object)
          })
        })
      )
    })

    it("filters by isActive", async () => {
      vi.mocked(ChatFlow.findAll).mockResolvedValue([])

      await listChatFlows({ tenantId: 1, isActive: false })

      expect(ChatFlow.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 1,
            isActive: false
          })
        })
      )
    })
  })

  describe("findChatFlowById", () => {
    it("returns a chat flow when found", async () => {
      const mockFlow = buildChatFlow({ id: 5 })
      vi.mocked(ChatFlow.findOne).mockResolvedValue(mockFlow as any)

      const result = await findChatFlowById(5, 1)

      expect(result).toBeDefined()
      expect(ChatFlow.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 5, tenantId: 1 }
        })
      )
    })

    it("throws AppError when not found", async () => {
      vi.mocked(ChatFlow.findOne).mockResolvedValue(null)

      await expect(findChatFlowById(999, 1)).rejects.toThrow(AppError)
      await expect(findChatFlowById(999, 1)).rejects.toThrow("ChatFlow not found")
    })
  })

  describe("createChatFlow", () => {
    it("creates a chat flow successfully", async () => {
      const created = buildChatFlow({ id: 10, name: "New Flow" })
      vi.mocked(ChatFlow.create).mockResolvedValue(created as any)

      const result = await createChatFlow(1, {
        name: "New Flow"
      })

      expect(result).toBeDefined()
      expect(ChatFlow.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          name: "New Flow",
          flow: {},
          isActive: true
        })
      )
    })

    it("accepts custom flow and isActive values", async () => {
      const customFlow = { nodes: [{ id: "1" }] }
      const created = buildChatFlow({ flow: customFlow, isActive: false })
      vi.mocked(ChatFlow.create).mockResolvedValue(created as any)

      await createChatFlow(1, {
        name: "Custom Flow",
        flow: customFlow,
        isActive: false
      })

      expect(ChatFlow.create).toHaveBeenCalledWith(
        expect.objectContaining({
          flow: customFlow,
          isActive: false
        })
      )
    })
  })

  describe("updateChatFlow", () => {
    it("updates a chat flow successfully", async () => {
      const mockFlow = buildChatFlow({ id: 1 })
      vi.mocked(ChatFlow.findOne).mockResolvedValue(mockFlow as any)

      const result = await updateChatFlow(1, 1, { name: "Updated Flow" })

      expect(result).toBeDefined()
      expect(mockFlow.update).toHaveBeenCalledWith({ name: "Updated Flow" })
    })

    it("throws AppError when not found", async () => {
      vi.mocked(ChatFlow.findOne).mockResolvedValue(null)

      await expect(
        updateChatFlow(999, 1, { name: "Updated" })
      ).rejects.toThrow("ChatFlow not found")
    })
  })

  describe("deleteChatFlow", () => {
    it("deletes a chat flow successfully", async () => {
      const mockFlow = buildChatFlow({ id: 1 })
      vi.mocked(ChatFlow.findOne).mockResolvedValue(mockFlow as any)
      vi.mocked(Ticket.count).mockResolvedValue(0)

      await deleteChatFlow(1, 1)

      expect(mockFlow.destroy).toHaveBeenCalled()
    })

    it("throws AppError when not found", async () => {
      vi.mocked(ChatFlow.findOne).mockResolvedValue(null)

      await expect(deleteChatFlow(999, 1)).rejects.toThrow("ChatFlow not found")
    })

    it("throws when chat flow has active tickets", async () => {
      const mockFlow = buildChatFlow({ id: 1 })
      vi.mocked(ChatFlow.findOne).mockResolvedValue(mockFlow as any)
      vi.mocked(Ticket.count).mockResolvedValue(3)

      await expect(deleteChatFlow(1, 1)).rejects.toThrow(
        "Cannot delete ChatFlow with active tickets"
      )
    })
  })

  describe("duplicateChatFlow", () => {
    it("duplicates a chat flow successfully", async () => {
      const original = buildChatFlow({
        id: 1,
        name: "Original Flow",
        flow: { nodes: [{ id: "n1" }] }
      })
      const duplicated = buildChatFlow({
        id: 2,
        name: "Original Flow (copy)",
        isActive: false
      })

      vi.mocked(ChatFlow.findOne).mockResolvedValue(original as any)
      vi.mocked(ChatFlow.create).mockResolvedValue(duplicated as any)

      const result = await duplicateChatFlow(1, 1)

      expect(result).toBeDefined()
      expect(ChatFlow.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          name: "Original Flow (copy)",
          isActive: false
        })
      )
    })

    it("throws AppError when original not found", async () => {
      vi.mocked(ChatFlow.findOne).mockResolvedValue(null)

      await expect(duplicateChatFlow(999, 1)).rejects.toThrow("ChatFlow not found")
    })
  })
})

import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/models/CallLog", () => ({
  default: {
    findOne: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn()
  }
}))

vi.mock("@/models/Contact", () => ({
  default: {}
}))

vi.mock("@/models/User", () => ({
  default: {}
}))

import {
  listCallLogs,
  findCallLogById,
  createCallLog,
  deleteCallLog
} from "../CallLogService"
import CallLog from "@/models/CallLog"
import { AppError } from "@/helpers/AppError"

function buildCallLog(overrides: Record<string, unknown> = {}) {
  const data = {
    id: 1,
    tenantId: 1,
    userId: 1,
    contactId: 1,
    type: "inbound",
    duration: 120,
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

describe("CallLogService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listCallLogs", () => {
    it("returns call logs for a tenant", async () => {
      const mockLogs = [
        buildCallLog({ id: 1 }),
        buildCallLog({ id: 2 })
      ]
      vi.mocked(CallLog.findAll).mockResolvedValue(mockLogs as any)

      const result = await listCallLogs({ tenantId: 1 })

      expect(result).toHaveLength(2)
      expect(CallLog.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 1 },
          order: [["createdAt", "DESC"]]
        })
      )
    })

    it("filters by type", async () => {
      vi.mocked(CallLog.findAll).mockResolvedValue([])

      await listCallLogs({ tenantId: 1, type: "outbound" })

      expect(CallLog.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 1,
            type: "outbound"
          })
        })
      )
    })

    it("filters by contactId", async () => {
      vi.mocked(CallLog.findAll).mockResolvedValue([])

      await listCallLogs({ tenantId: 1, contactId: 5 })

      expect(CallLog.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 1,
            contactId: 5
          })
        })
      )
    })
  })

  describe("findCallLogById", () => {
    it("returns a call log when found", async () => {
      const mockLog = buildCallLog({ id: 5 })
      vi.mocked(CallLog.findOne).mockResolvedValue(mockLog as any)

      const result = await findCallLogById(5, 1)

      expect(result).toBeDefined()
      expect(CallLog.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 5, tenantId: 1 }
        })
      )
    })

    it("throws AppError when not found", async () => {
      vi.mocked(CallLog.findOne).mockResolvedValue(null)

      await expect(findCallLogById(999, 1)).rejects.toThrow(AppError)
      await expect(findCallLogById(999, 1)).rejects.toThrow("CallLog not found")
    })
  })

  describe("createCallLog", () => {
    it("creates a call log successfully", async () => {
      const created = buildCallLog({ id: 10 })
      vi.mocked(CallLog.create).mockResolvedValue(created as any)
      vi.mocked(CallLog.findOne).mockResolvedValue(created as any)

      const result = await createCallLog(1, 1, {
        contactId: 1,
        type: "inbound",
        duration: 60
      })

      expect(result).toBeDefined()
      expect(CallLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          userId: 1,
          contactId: 1,
          type: "inbound",
          duration: 60
        })
      )
    })
  })

  describe("deleteCallLog", () => {
    it("deletes a call log successfully", async () => {
      const mockLog = buildCallLog({ id: 1 })
      vi.mocked(CallLog.findOne).mockResolvedValue(mockLog as any)

      await deleteCallLog(1, 1)

      expect(mockLog.destroy).toHaveBeenCalled()
    })

    it("throws AppError when not found", async () => {
      vi.mocked(CallLog.findOne).mockResolvedValue(null)

      await expect(deleteCallLog(999, 1)).rejects.toThrow("CallLog not found")
    })
  })
})

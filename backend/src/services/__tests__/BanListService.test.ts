import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/models/BanList", () => ({
  default: {
    findOne: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn()
  }
}))

import {
  listBanLists,
  createBanList,
  deleteBanList
} from "../BanListService"
import BanList from "@/models/BanList"

function buildBanList(overrides: Record<string, unknown> = {}) {
  const data = {
    id: 1,
    tenantId: 1,
    number: "5511999999999",
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

describe("BanListService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listBanLists", () => {
    it("returns ban lists for a tenant", async () => {
      const mockBanLists = [
        buildBanList({ id: 1, number: "5511111111111" }),
        buildBanList({ id: 2, number: "5511222222222" })
      ]
      vi.mocked(BanList.findAll).mockResolvedValue(mockBanLists as any)

      const result = await listBanLists({ tenantId: 1 })

      expect(result).toHaveLength(2)
      expect(BanList.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 1 },
          order: [["createdAt", "DESC"]]
        })
      )
    })

    it("filters by searchParam", async () => {
      vi.mocked(BanList.findAll).mockResolvedValue([])

      await listBanLists({ tenantId: 1, searchParam: "5511" })

      expect(BanList.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 1,
            number: expect.any(Object)
          })
        })
      )
    })
  })

  describe("createBanList", () => {
    it("creates a ban list entry successfully", async () => {
      vi.mocked(BanList.findOne).mockResolvedValue(null)

      const created = buildBanList({ id: 10, number: "5511333333333" })
      vi.mocked(BanList.create).mockResolvedValue(created as any)

      const result = await createBanList(1, { number: "5511333333333" })

      expect(result).toBeDefined()
      expect(BanList.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          number: "5511333333333"
        })
      )
    })

    it("throws when number already exists", async () => {
      const existing = buildBanList({ number: "5511999999999" })
      vi.mocked(BanList.findOne).mockResolvedValue(existing as any)

      await expect(
        createBanList(1, { number: "5511999999999" })
      ).rejects.toThrow("A ban list with this number already exists")
    })
  })

  describe("deleteBanList", () => {
    it("deletes a ban list entry successfully", async () => {
      const mockBanList = buildBanList({ id: 1 })
      vi.mocked(BanList.findOne).mockResolvedValue(mockBanList as any)

      await deleteBanList(1, 1)

      expect(mockBanList.destroy).toHaveBeenCalled()
    })

    it("throws when ban list entry not found", async () => {
      vi.mocked(BanList.findOne).mockResolvedValue(null)

      await expect(deleteBanList(999, 1)).rejects.toThrow("Ban list not found")
    })
  })
})

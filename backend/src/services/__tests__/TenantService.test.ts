import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/models/Tenant", () => ({
  default: {
    findOne: vi.fn(),
    findByPk: vi.fn(),
    findAndCountAll: vi.fn(),
    create: vi.fn()
  }
}))

vi.mock("@/models/User", () => ({
  default: {}
}))

import {
  listTenants,
  findTenantById,
  createTenant,
  updateTenant
} from "../TenantService"
import Tenant from "@/models/Tenant"
import { buildTenant } from "@/__tests__/factories"
import { AppError } from "@/helpers/AppError"

describe("TenantService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listTenants", () => {
    it("returns paginated tenants", async () => {
      const mockTenants = [
        buildTenant({ id: 1, name: "Tenant A" }),
        buildTenant({ id: 2, name: "Tenant B" })
      ]
      vi.mocked(Tenant.findAndCountAll).mockResolvedValue({
        rows: mockTenants,
        count: 2
      } as any)

      const result = await listTenants({})

      expect(result.tenants).toHaveLength(2)
      expect(result.count).toBe(2)
      expect(result.hasMore).toBe(false)
      expect(Tenant.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          limit: 20,
          offset: 0,
          order: [["name", "ASC"]]
        })
      )
    })

    it("filters by searchParam", async () => {
      vi.mocked(Tenant.findAndCountAll).mockResolvedValue({
        rows: [],
        count: 0
      } as any)

      await listTenants({ searchParam: "acme" })

      expect(Tenant.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.any(Object)
          })
        })
      )
    })

    it("returns hasMore when more results exist", async () => {
      vi.mocked(Tenant.findAndCountAll).mockResolvedValue({
        rows: [buildTenant({ id: 1 })],
        count: 50
      } as any)

      const result = await listTenants({ pageNumber: "1", limit: "20" })

      expect(result.hasMore).toBe(true)
    })
  })

  describe("findTenantById", () => {
    it("returns a tenant when found", async () => {
      const mockTenant = buildTenant({ id: 5 })
      vi.mocked(Tenant.findByPk).mockResolvedValue(mockTenant as any)

      const result = await findTenantById(5)

      expect(result).toBeDefined()
      expect(Tenant.findByPk).toHaveBeenCalledWith(
        5,
        expect.objectContaining({
          include: expect.any(Array)
        })
      )
    })

    it("throws AppError when not found", async () => {
      vi.mocked(Tenant.findByPk).mockResolvedValue(null)

      await expect(findTenantById(999)).rejects.toThrow(AppError)
      await expect(findTenantById(999)).rejects.toThrow("Tenant not found")
    })
  })

  describe("createTenant", () => {
    it("creates a tenant successfully", async () => {
      vi.mocked(Tenant.findOne).mockResolvedValue(null)

      const created = buildTenant({ id: 10, name: "New Tenant" })
      vi.mocked(Tenant.create).mockResolvedValue(created as any)

      const result = await createTenant({ name: "New Tenant" })

      expect(result).toBeDefined()
      expect(Tenant.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New Tenant"
        })
      )
    })

    it("throws when name already exists", async () => {
      const existing = buildTenant({ name: "Acme" })
      vi.mocked(Tenant.findOne).mockResolvedValue(existing as any)

      await expect(
        createTenant({ name: "Acme" })
      ).rejects.toThrow("A tenant with this name already exists")
    })
  })

  describe("updateTenant", () => {
    it("updates a tenant successfully", async () => {
      const mockTenant = buildTenant({ id: 1 })
      vi.mocked(Tenant.findByPk).mockResolvedValue(mockTenant as any)
      vi.mocked(Tenant.findOne).mockResolvedValue(null)

      const result = await updateTenant(1, { name: "Updated Tenant" })

      expect(result).toBeDefined()
      expect(mockTenant.update).toHaveBeenCalledWith({ name: "Updated Tenant" })
    })

    it("throws when tenant not found", async () => {
      vi.mocked(Tenant.findByPk).mockResolvedValue(null)

      await expect(
        updateTenant(999, { name: "Updated" })
      ).rejects.toThrow("Tenant not found")
    })

    it("throws when new name conflicts", async () => {
      const mockTenant = buildTenant({ id: 1 })
      const conflicting = buildTenant({ id: 2, name: "Other" })

      vi.mocked(Tenant.findByPk).mockResolvedValue(mockTenant as any)
      vi.mocked(Tenant.findOne).mockResolvedValue(conflicting as any)

      await expect(
        updateTenant(1, { name: "Other" })
      ).rejects.toThrow("A tenant with this name already exists")
    })
  })
})

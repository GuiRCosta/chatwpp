import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/models/WhatsApp", () => ({
  default: {
    findOne: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn()
  }
}))

vi.mock("@/models/Tenant", () => ({
  default: {
    findByPk: vi.fn()
  }
}))

import {
  listWhatsApps,
  findWhatsAppById,
  getDefaultWhatsApp,
  createWhatsApp,
  updateWhatsApp,
  deleteWhatsApp
} from "../WhatsAppService"
import WhatsApp from "@/models/WhatsApp"
import { buildWhatsApp, buildTenant } from "@/__tests__/factories"
import { AppError } from "@/helpers/AppError"

describe("WhatsAppService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listWhatsApps", () => {
    it("returns whatsapp connections for a tenant", async () => {
      const mockConnections = [
        buildWhatsApp({ id: 1, name: "Connection A" }),
        buildWhatsApp({ id: 2, name: "Connection B" })
      ]
      vi.mocked(WhatsApp.findAll).mockResolvedValue(mockConnections as any)

      const result = await listWhatsApps({ tenantId: 1 })

      expect(result).toHaveLength(2)
      expect(WhatsApp.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 1 },
          order: [["name", "ASC"]]
        })
      )
    })
  })

  describe("findWhatsAppById", () => {
    it("returns a whatsapp connection when found", async () => {
      const mockWhatsApp = buildWhatsApp({ id: 5 })
      vi.mocked(WhatsApp.findOne).mockResolvedValue(mockWhatsApp as any)

      const result = await findWhatsAppById(5, 1)

      expect(result).toBeDefined()
      expect(WhatsApp.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 5, tenantId: 1 }
        })
      )
    })

    it("throws AppError when not found", async () => {
      vi.mocked(WhatsApp.findOne).mockResolvedValue(null)

      await expect(findWhatsAppById(999, 1)).rejects.toThrow(AppError)
      await expect(findWhatsAppById(999, 1)).rejects.toThrow("WhatsApp connection not found")
    })
  })

  describe("getDefaultWhatsApp", () => {
    it("returns the default connection", async () => {
      const mockDefault = buildWhatsApp({ id: 1, isDefault: true })
      vi.mocked(WhatsApp.findOne).mockResolvedValue(mockDefault as any)

      const result = await getDefaultWhatsApp(1)

      expect(result).toBeDefined()
      expect(WhatsApp.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 1, isDefault: true }
        })
      )
    })

    it("throws when no default connection found", async () => {
      vi.mocked(WhatsApp.findOne).mockResolvedValue(null)

      await expect(getDefaultWhatsApp(1)).rejects.toThrow(
        "No default WhatsApp connection found"
      )
    })
  })

  describe("createWhatsApp", () => {
    it("creates a whatsapp connection successfully", async () => {
      const Tenant = (await import("@/models/Tenant")).default
      const mockTenant = buildTenant({ id: 1, maxConnections: 5 })
      vi.mocked(Tenant.findByPk).mockResolvedValue(mockTenant as any)
      vi.mocked(WhatsApp.count).mockResolvedValue(0)

      const created = buildWhatsApp({ id: 10, name: "New Connection" })
      vi.mocked(WhatsApp.create).mockResolvedValue(created as any)

      const result = await createWhatsApp(1, { name: "New Connection" })

      expect(result).toBeDefined()
      expect(WhatsApp.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          name: "New Connection",
          type: "waba"
        })
      )
    })

    it("unsets other defaults when isDefault is true", async () => {
      const Tenant = (await import("@/models/Tenant")).default
      const mockTenant = buildTenant({ id: 1, maxConnections: 5 })
      vi.mocked(Tenant.findByPk).mockResolvedValue(mockTenant as any)
      vi.mocked(WhatsApp.count).mockResolvedValue(0)

      const created = buildWhatsApp({ id: 10, isDefault: true })
      vi.mocked(WhatsApp.create).mockResolvedValue(created as any)

      await createWhatsApp(1, { name: "Default Connection", isDefault: true })

      expect(WhatsApp.update).toHaveBeenCalledWith(
        { isDefault: false },
        { where: { tenantId: 1 } }
      )
    })

    it("throws when connection limit reached", async () => {
      const Tenant = (await import("@/models/Tenant")).default
      const mockTenant = buildTenant({ id: 1, maxConnections: 2 })
      vi.mocked(Tenant.findByPk).mockResolvedValue(mockTenant as any)
      vi.mocked(WhatsApp.count).mockResolvedValue(2)

      await expect(
        createWhatsApp(1, { name: "Over Limit" })
      ).rejects.toThrow("Connection limit reached for this tenant")
    })
  })

  describe("updateWhatsApp", () => {
    it("updates a whatsapp connection successfully", async () => {
      const mockWhatsApp = buildWhatsApp({ id: 1 })
      vi.mocked(WhatsApp.findOne).mockResolvedValue(mockWhatsApp as any)

      const result = await updateWhatsApp(1, 1, { name: "Updated Connection" })

      expect(result).toBeDefined()
      expect(mockWhatsApp.update).toHaveBeenCalledWith({ name: "Updated Connection" })
    })

    it("throws when not found", async () => {
      vi.mocked(WhatsApp.findOne).mockResolvedValue(null)

      await expect(
        updateWhatsApp(999, 1, { name: "Updated" })
      ).rejects.toThrow("WhatsApp connection not found")
    })

    it("unsets other defaults when setting isDefault to true", async () => {
      const mockWhatsApp = buildWhatsApp({ id: 1 })
      vi.mocked(WhatsApp.findOne).mockResolvedValue(mockWhatsApp as any)

      await updateWhatsApp(1, 1, { isDefault: true })

      expect(WhatsApp.update).toHaveBeenCalledWith(
        { isDefault: false },
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 1 })
        })
      )
    })
  })

  describe("deleteWhatsApp", () => {
    it("deletes a whatsapp connection successfully", async () => {
      const mockWhatsApp = buildWhatsApp({ id: 1, isDefault: false })
      vi.mocked(WhatsApp.findOne).mockResolvedValue(mockWhatsApp as any)

      await deleteWhatsApp(1, 1)

      expect(mockWhatsApp.destroy).toHaveBeenCalled()
    })

    it("throws when not found", async () => {
      vi.mocked(WhatsApp.findOne).mockResolvedValue(null)

      await expect(deleteWhatsApp(999, 1)).rejects.toThrow("WhatsApp connection not found")
    })

    it("throws when trying to delete the default connection", async () => {
      const mockWhatsApp = buildWhatsApp({ id: 1, isDefault: true })
      vi.mocked(WhatsApp.findOne).mockResolvedValue(mockWhatsApp as any)

      await expect(deleteWhatsApp(1, 1)).rejects.toThrow(
        "Cannot delete the default WhatsApp connection. Set another as default first."
      )
    })
  })
})

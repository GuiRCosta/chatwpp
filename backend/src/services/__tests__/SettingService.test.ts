import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/models/Setting", () => ({
  default: {
    findOne: vi.fn(),
    findAll: vi.fn(),
    upsert: vi.fn()
  }
}))

import {
  getSettings,
  getSettingByKey,
  updateSetting,
  updateSettingsBulk
} from "../SettingService"
import Setting from "@/models/Setting"
import { buildSetting } from "@/__tests__/factories"

describe("SettingService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getSettings", () => {
    it("returns settings as a key-value map", async () => {
      const mockSettings = [
        buildSetting({ key: "theme", value: "dark" }),
        buildSetting({ key: "language", value: "en" })
      ]
      vi.mocked(Setting.findAll).mockResolvedValue(mockSettings as any)

      const result = await getSettings(1)

      expect(result).toEqual({
        theme: "dark",
        language: "en"
      })
      expect(Setting.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 1 },
          order: [["key", "ASC"]]
        })
      )
    })

    it("returns empty object when no settings", async () => {
      vi.mocked(Setting.findAll).mockResolvedValue([])

      const result = await getSettings(1)

      expect(result).toEqual({})
    })
  })

  describe("getSettingByKey", () => {
    it("returns setting value when found", async () => {
      const mockSetting = buildSetting({ key: "theme", value: "dark" })
      vi.mocked(Setting.findOne).mockResolvedValue(mockSetting as any)

      const result = await getSettingByKey(1, "theme")

      expect(result).toBe("dark")
      expect(Setting.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 1, key: "theme" }
        })
      )
    })

    it("returns null when setting not found", async () => {
      vi.mocked(Setting.findOne).mockResolvedValue(null)

      const result = await getSettingByKey(1, "nonexistent")

      expect(result).toBeNull()
    })
  })

  describe("updateSetting", () => {
    it("upserts a setting successfully", async () => {
      const mockSetting = buildSetting({ key: "theme", value: "light" })
      vi.mocked(Setting.upsert).mockResolvedValue([mockSetting] as any)

      const result = await updateSetting(1, "theme", "light")

      expect(result).toBeDefined()
      expect(Setting.upsert).toHaveBeenCalledWith({
        tenantId: 1,
        key: "theme",
        value: "light"
      })
    })
  })

  describe("updateSettingsBulk", () => {
    it("upserts multiple settings and returns all settings", async () => {
      vi.mocked(Setting.upsert).mockResolvedValue([buildSetting()] as any)

      const allSettings = [
        buildSetting({ key: "theme", value: "dark" }),
        buildSetting({ key: "language", value: "pt" })
      ]
      vi.mocked(Setting.findAll).mockResolvedValue(allSettings as any)

      const result = await updateSettingsBulk(1, [
        { key: "theme", value: "dark" },
        { key: "language", value: "pt" }
      ])

      expect(Setting.upsert).toHaveBeenCalledTimes(2)
      expect(result).toEqual({
        theme: "dark",
        language: "pt"
      })
    })
  })
})

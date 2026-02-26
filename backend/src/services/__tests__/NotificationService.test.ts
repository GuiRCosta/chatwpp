import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/models/Notification", () => ({
  default: {
    findOne: vi.fn(),
    findAndCountAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  }
}))

import {
  listNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from "../NotificationService"
import Notification from "@/models/Notification"
import { buildNotification } from "@/__tests__/factories"
import { AppError } from "@/helpers/AppError"

describe("NotificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listNotifications", () => {
    it("returns paginated notifications", async () => {
      const mockNotifications = [
        buildNotification({ id: 1 }),
        buildNotification({ id: 2 })
      ]
      vi.mocked(Notification.findAndCountAll).mockResolvedValue({
        rows: mockNotifications,
        count: 2
      } as any)

      const result = await listNotifications({ tenantId: 1, userId: 1 })

      expect(result.notifications).toHaveLength(2)
      expect(result.count).toBe(2)
      expect(result.hasMore).toBe(false)
      expect(Notification.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 1, userId: 1 },
          limit: 20,
          offset: 0,
          order: [["createdAt", "DESC"]]
        })
      )
    })

    it("filters by isRead", async () => {
      vi.mocked(Notification.findAndCountAll).mockResolvedValue({
        rows: [],
        count: 0
      } as any)

      await listNotifications({ tenantId: 1, userId: 1, isRead: "false" })

      expect(Notification.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 1,
            userId: 1,
            isRead: false
          })
        })
      )
    })

    it("returns hasMore when there are more results", async () => {
      const mockNotifications = [buildNotification({ id: 1 })]
      vi.mocked(Notification.findAndCountAll).mockResolvedValue({
        rows: mockNotifications,
        count: 25
      } as any)

      const result = await listNotifications({
        tenantId: 1,
        userId: 1,
        pageNumber: "1",
        limit: "20"
      })

      expect(result.hasMore).toBe(true)
    })
  })

  describe("createNotification", () => {
    it("creates a notification successfully", async () => {
      const created = buildNotification({ id: 10 })
      vi.mocked(Notification.create).mockResolvedValue(created as any)

      const result = await createNotification(1, {
        userId: 1,
        title: "New message",
        message: "You have a new message"
      })

      expect(result).toBeDefined()
      expect(Notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          userId: 1,
          title: "New message",
          message: "You have a new message",
          isRead: false
        })
      )
    })
  })

  describe("markAsRead", () => {
    it("marks a notification as read", async () => {
      const mockNotification = buildNotification({ id: 1, isRead: false })
      vi.mocked(Notification.findOne).mockResolvedValue(mockNotification as any)

      const result = await markAsRead(1, 1, 1)

      expect(result).toBeDefined()
      expect(mockNotification.update).toHaveBeenCalledWith({ isRead: true })
    })

    it("throws when notification not found", async () => {
      vi.mocked(Notification.findOne).mockResolvedValue(null)

      await expect(markAsRead(999, 1, 1)).rejects.toThrow(AppError)
      await expect(markAsRead(999, 1, 1)).rejects.toThrow("Notification not found")
    })
  })

  describe("markAllAsRead", () => {
    it("marks all notifications as read", async () => {
      vi.mocked(Notification.update).mockResolvedValue([5] as any)

      const result = await markAllAsRead(1, 1)

      expect(result).toBe(5)
      expect(Notification.update).toHaveBeenCalledWith(
        { isRead: true },
        { where: { tenantId: 1, userId: 1, isRead: false } }
      )
    })
  })

  describe("deleteNotification", () => {
    it("deletes a notification successfully", async () => {
      const mockNotification = buildNotification({ id: 1 })
      vi.mocked(Notification.findOne).mockResolvedValue(mockNotification as any)

      await deleteNotification(1, 1, 1)

      expect(mockNotification.destroy).toHaveBeenCalled()
    })

    it("throws when notification not found", async () => {
      vi.mocked(Notification.findOne).mockResolvedValue(null)

      await expect(deleteNotification(999, 1, 1)).rejects.toThrow("Notification not found")
    })
  })
})

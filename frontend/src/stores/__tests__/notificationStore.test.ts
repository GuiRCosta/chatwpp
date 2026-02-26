import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest"
import { server } from "@/__tests__/mocks/server"
import { resetAllStores } from "@/__tests__/utils/storeReset"
import { http, HttpResponse } from "msw"
import { useNotificationStore } from "@/stores/notificationStore"
import type { Notification } from "@/types"

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => {
  server.resetHandlers()
  resetAllStores()
})
afterAll(() => server.close())

const createNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: 1,
  title: "Test Notification",
  message: "Test message",
  isRead: false,
  userId: 1,
  tenantId: 1,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  ...overrides
})

describe("notificationStore", () => {
  describe("initial state", () => {
    it("has empty notifications array", () => {
      expect(useNotificationStore.getState().notifications).toEqual([])
    })

    it("has unreadCount set to 0", () => {
      expect(useNotificationStore.getState().unreadCount).toBe(0)
    })
  })

  describe("fetchNotifications", () => {
    it("populates notifications and counts unread", async () => {
      const notifications = [
        createNotification({ id: 1, isRead: false }),
        createNotification({ id: 2, isRead: true }),
        createNotification({ id: 3, isRead: false })
      ]

      server.use(
        http.get("/api/notifications", () => {
          return HttpResponse.json({
            success: true,
            data: notifications,
            meta: { total: 3, page: 1, limit: 20, hasMore: false }
          })
        })
      )

      await useNotificationStore.getState().fetchNotifications()

      const state = useNotificationStore.getState()
      expect(state.notifications).toHaveLength(3)
      expect(state.unreadCount).toBe(2)
    })

    it("sets unreadCount to 0 when all are read", async () => {
      const notifications = [
        createNotification({ id: 1, isRead: true }),
        createNotification({ id: 2, isRead: true })
      ]

      server.use(
        http.get("/api/notifications", () => {
          return HttpResponse.json({
            success: true,
            data: notifications,
            meta: { total: 2, page: 1, limit: 20, hasMore: false }
          })
        })
      )

      await useNotificationStore.getState().fetchNotifications()

      expect(useNotificationStore.getState().unreadCount).toBe(0)
    })
  })

  describe("markAsRead", () => {
    it("updates notification and decrements unread count", async () => {
      useNotificationStore.setState({
        notifications: [
          createNotification({ id: 1, isRead: false }),
          createNotification({ id: 2, isRead: false })
        ],
        unreadCount: 2
      })

      await useNotificationStore.getState().markAsRead(1)

      const state = useNotificationStore.getState()
      const notification = state.notifications.find((n) => n.id === 1)
      expect(notification?.isRead).toBe(true)
      expect(state.unreadCount).toBe(1)
    })

    it("does not affect other notifications", async () => {
      useNotificationStore.setState({
        notifications: [
          createNotification({ id: 1, isRead: false }),
          createNotification({ id: 2, isRead: false })
        ],
        unreadCount: 2
      })

      await useNotificationStore.getState().markAsRead(1)

      const notification2 = useNotificationStore
        .getState()
        .notifications.find((n) => n.id === 2)
      expect(notification2?.isRead).toBe(false)
    })
  })

  describe("markAllAsRead", () => {
    it("sets all notifications isRead to true and count to 0", async () => {
      useNotificationStore.setState({
        notifications: [
          createNotification({ id: 1, isRead: false }),
          createNotification({ id: 2, isRead: false }),
          createNotification({ id: 3, isRead: true })
        ],
        unreadCount: 2
      })

      await useNotificationStore.getState().markAllAsRead()

      const state = useNotificationStore.getState()
      expect(state.notifications.every((n) => n.isRead)).toBe(true)
      expect(state.unreadCount).toBe(0)
    })
  })

  describe("addNotification", () => {
    it("prepends notification to array", () => {
      const existing = createNotification({ id: 1 })
      useNotificationStore.setState({
        notifications: [existing],
        unreadCount: 1
      })

      const newNotification = createNotification({ id: 2, title: "New" })
      useNotificationStore.getState().addNotification(newNotification)

      const state = useNotificationStore.getState()
      expect(state.notifications).toHaveLength(2)
      expect(state.notifications[0].id).toBe(2)
      expect(state.notifications[1].id).toBe(1)
    })

    it("increments unreadCount for unread notification", () => {
      useNotificationStore.setState({
        notifications: [],
        unreadCount: 0
      })

      const unreadNotification = createNotification({ isRead: false })
      useNotificationStore.getState().addNotification(unreadNotification)

      expect(useNotificationStore.getState().unreadCount).toBe(1)
    })

    it("does not increment unreadCount for read notification", () => {
      useNotificationStore.setState({
        notifications: [],
        unreadCount: 0
      })

      const readNotification = createNotification({ isRead: true })
      useNotificationStore.getState().addNotification(readNotification)

      expect(useNotificationStore.getState().unreadCount).toBe(0)
    })
  })
})

import { create } from "zustand"
import api from "@/lib/api"
import type { Notification, ApiResponse } from "@/types"

interface NotificationListResponse {
  notifications: Notification[]
  count: number
  hasMore: boolean
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  fetchNotifications: () => Promise<void>
  markAsRead: (id: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  addNotification: (notification: Notification) => void
  deleteNotification: (id: number) => Promise<void>
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [],
  unreadCount: 0,

  fetchNotifications: async () => {
    try {
      const response = await api.get<ApiResponse<NotificationListResponse>>(
        "/notifications"
      )

      if (response.data.success && response.data.data) {
        const notifications = response.data.data.notifications || []
        const unreadCount = notifications.filter((n) => !n.isRead).length

        set({
          notifications,
          unreadCount
        })
      }
    } catch {
      // Silently handle - notifications will stay empty
    }
  },

  markAsRead: async (id: number) => {
    try {
      const response = await api.put<ApiResponse<Notification>>(
        `/notifications/${id}/read`
      )

      if (response.data.success && response.data.data) {
        const updatedNotification = response.data.data

        set((state) => {
          const notifications = state.notifications.map((n) =>
            n.id === id ? updatedNotification : n
          )

          const unreadCount = notifications.filter((n) => !n.isRead).length

          return {
            notifications,
            unreadCount
          }
        })
      }
    } catch {
      // Silently handle
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await api.put<ApiResponse<{ message: string }>>(
        "/notifications/read-all"
      )

      if (response.data.success) {
        set((state) => {
          const notifications = state.notifications.map((n) => ({
            ...n,
            isRead: true
          }))

          return {
            notifications,
            unreadCount: 0
          }
        })
      }
    } catch {
      // Silently handle
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => {
      const notifications = [notification, ...state.notifications]
      const unreadCount = notification.isRead
        ? state.unreadCount
        : state.unreadCount + 1

      return {
        notifications,
        unreadCount
      }
    })
  },

  deleteNotification: async (id: number) => {
    try {
      const response = await api.delete<ApiResponse<{ message: string }>>(
        `/notifications/${id}`
      )

      if (response.data.success) {
        set((state) => {
          const target = state.notifications.find((n) => n.id === id)
          const notifications = state.notifications.filter((n) => n.id !== id)
          const unreadCount =
            target && !target.isRead
              ? state.unreadCount - 1
              : state.unreadCount

          return {
            notifications,
            unreadCount
          }
        })
      }
    } catch {
      // Silently handle
    }
  }
}))

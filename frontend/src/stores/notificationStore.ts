import { create } from "zustand"
import api from "@/lib/api"
import type { Notification, ApiResponse, PaginatedResponse } from "@/types"

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  fetchNotifications: () => Promise<void>
  markAsRead: (id: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  addNotification: (notification: Notification) => void
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [],
  unreadCount: 0,

  fetchNotifications: async () => {
    try {
      const response = await api.get<PaginatedResponse<Notification>>(
        "/notifications"
      )

      if (response.data.success) {
        const notifications = response.data.data
        const unreadCount = notifications.filter((n) => !n.isRead).length

        set({
          notifications,
          unreadCount
        })
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
      throw error
    }
  },

  markAsRead: async (id: number) => {
    try {
      const response = await api.patch<ApiResponse<Notification>>(
        `/notifications/${id}/read`
      )

      if (response.data.success) {
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
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
      throw error
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await api.patch<ApiResponse<{ count: number }>>(
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
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
      throw error
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
  }
}))

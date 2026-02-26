import { useEffect } from "react"
import { useAuth } from "./useAuth"
import { getSocket } from "@/lib/socket"
import { useNotificationStore } from "@/stores/notificationStore"
import type { Notification } from "@/types"

export function useSocket() {
  const { isAuthenticated } = useAuth()
  const { addNotification } = useNotificationStore()

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    const socket = getSocket()

    if (!socket) {
      return
    }

    // Listen to notification events
    socket.on("notification:created", (notification: Notification) => {
      addNotification(notification)
    })

    // Listen to ticket events
    socket.on("ticket:updated", (data: { ticketId: number; status: string }) => {
      console.info("Ticket updated:", data)
      // TODO: Update ticket store when implemented
    })

    // Listen to message events
    socket.on(
      "message:created",
      (data: { ticketId: number; message: unknown }) => {
        console.info("Message created:", data)
        // TODO: Update message/ticket store when implemented
      }
    )

    // Cleanup listeners on unmount
    return () => {
      socket.off("notification:created")
      socket.off("ticket:updated")
      socket.off("message:created")
    }
  }, [isAuthenticated, addNotification])

  return {
    socket: getSocket()
  }
}

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { useAuth } from "./useAuth"
import { getSocket } from "@/lib/socket"
import { useNotificationStore } from "@/stores/notificationStore"
import { useTicketStore } from "@/stores/ticketStore"
import { useChatStore } from "@/stores/chatStore"
import type { Contact, Notification, Ticket, Message } from "@/types"

export function useSocket() {
  const { isAuthenticated } = useAuth()
  const addNotification = useNotificationStore((s) => s.addNotification)
  const addTicket = useTicketStore((s) => s.addTicket)
  const updateTicket = useTicketStore((s) => s.updateTicket)
  const removeTicket = useTicketStore((s) => s.removeTicket)
  const addMessage = useChatStore((s) => s.addMessage)
  const updateMessage = useChatStore((s) => s.updateMessage)
  const registeredRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated) {
      registeredRef.current = false
      return
    }

    const socket = getSocket()

    if (!socket || registeredRef.current) {
      return
    }

    registeredRef.current = true

    // ── Notifications ──
    socket.on("notification:created", (notification: Notification) => {
      addNotification(notification)
    })

    // ── Tickets ──
    socket.on("ticket:created", (ticket: Ticket) => {
      addTicket(ticket)
    })

    socket.on("ticket:updated", (ticket: Ticket) => {
      updateTicket(ticket)
    })

    socket.on("ticket:deleted", (data: { id: number }) => {
      removeTicket(data.id)
    })

    // ── Messages ──
    socket.on("message:created", (message: Message) => {
      addMessage(message)

      // Also update the ticket's lastMessage in the sidebar
      const ticketStore = useTicketStore.getState()
      const existingTicket = ticketStore.tickets.find(
        (t) => t.id === message.ticketId
      )

      if (existingTicket) {
        updateTicket({
          ...existingTicket,
          lastMessage: message.body || existingTicket.lastMessage,
          lastMessageAt: message.createdAt,
          unreadMessages: message.fromMe
            ? existingTicket.unreadMessages
            : existingTicket.unreadMessages + 1
        })
      }
    })

    socket.on(
      "message:updated",
      (message: Partial<Message> & { id: number }) => {
        updateMessage(message)
      }
    )

    // ── Contacts ──
    socket.on("contact:created", (contact: Contact) => {
      toast.info(`Novo contato: ${contact.name}`)
    })

    socket.on("contact:updated", (contact: Contact) => {
      toast.info(`Contato atualizado: ${contact.name}`)
    })

    // Cleanup listeners on unmount
    return () => {
      socket.off("notification:created")
      socket.off("ticket:created")
      socket.off("ticket:updated")
      socket.off("ticket:deleted")
      socket.off("message:created")
      socket.off("message:updated")
      socket.off("contact:created")
      socket.off("contact:updated")
      registeredRef.current = false
    }
  }, [
    isAuthenticated,
    addNotification,
    addTicket,
    updateTicket,
    removeTicket,
    addMessage,
    updateMessage
  ])

  return { socket: getSocket() }
}

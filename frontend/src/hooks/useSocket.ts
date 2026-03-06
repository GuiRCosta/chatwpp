import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { useAuthStore } from "@/stores/authStore"
import { getSocket } from "@/lib/socket"
import { useNotificationStore } from "@/stores/notificationStore"
import { useTicketStore } from "@/stores/ticketStore"
import { useChatStore } from "@/stores/chatStore"
import type { Campaign, Contact, Notification, Ticket, Message } from "@/types"

export function useSocket() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
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

    // ── Campaigns ──
    socket.on("campaign:created", (campaign: Campaign) => {
      toast.info(`Nova campanha: ${campaign.name}`)
    })

    socket.on("campaign:updated", (campaign: Campaign) => {
      const statusMap: Record<string, string> = {
        completed: "concluida",
        running: "em andamento",
        processing: "processando",
        cancelled: "cancelada"
      }
      const statusLabel = statusMap[campaign.status] || campaign.status
      toast.info(`Campanha "${campaign.name}" ${statusLabel}`)
    })

    socket.on("campaign:started", (data: { id: number }) => {
      toast.success(`Campanha #${data.id} iniciada`)
    })

    socket.on("campaign:cancelled", (campaign: Campaign) => {
      toast.info(`Campanha "${campaign.name}" cancelada`)
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
      socket.off("campaign:created")
      socket.off("campaign:updated")
      socket.off("campaign:started")
      socket.off("campaign:cancelled")
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

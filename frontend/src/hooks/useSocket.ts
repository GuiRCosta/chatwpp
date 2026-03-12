import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { useAuthStore } from "@/stores/authStore"
import { getSocket } from "@/lib/socket"
import { useNotificationStore } from "@/stores/notificationStore"
import { useTicketStore } from "@/stores/ticketStore"
import { useChatStore } from "@/stores/chatStore"
import { useWhatsAppStore } from "@/stores/whatsappStore"
import type { Campaign, Contact, Notification, Ticket, Message, WhatsApp } from "@/types"

export function useSocket() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
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
      useNotificationStore.getState().addNotification(notification)
    })

    // ── Tickets ──
    socket.on("ticket:created", (ticket: Ticket) => {
      useTicketStore.getState().addTicket(ticket)
    })

    socket.on("ticket:updated", (ticket: Ticket) => {
      useTicketStore.getState().updateTicket(ticket)
    })

    socket.on("ticket:deleted", (data: { id: number }) => {
      useTicketStore.getState().removeTicket(data.id)
    })

    // ── Messages ──
    socket.on("message:created", (message: Message) => {
      useChatStore.getState().addMessage(message)

      // Also update the ticket's lastMessage in the sidebar
      const ticketStore = useTicketStore.getState()
      const existingTicket = ticketStore.tickets.find(
        (t) => t.id === message.ticketId
      )

      if (existingTicket) {
        useTicketStore.getState().updateTicket({
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
        useChatStore.getState().updateMessage(message)
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

    // ── WhatsApp Connections ──
    socket.on("whatsapp:created", (connection: WhatsApp) => {
      useWhatsAppStore.getState().addConnection(connection)
    })

    socket.on("whatsapp:updated", (connection: WhatsApp) => {
      useWhatsAppStore.getState().updateConnection(connection)
    })

    socket.on("whatsapp:deleted", (data: { id: number }) => {
      useWhatsAppStore.getState().removeConnection(data.id)
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
      socket.off("whatsapp:created")
      socket.off("whatsapp:updated")
      socket.off("whatsapp:deleted")
      registeredRef.current = false
    }
  }, [isAuthenticated])

  return { socket: getSocket() }
}

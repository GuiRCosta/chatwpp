import { useAuthStore } from "@/stores/authStore"
import { useTicketStore } from "@/stores/ticketStore"
import { useChatStore } from "@/stores/chatStore"
import { useNotificationStore } from "@/stores/notificationStore"

export function resetAllStores() {
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false
  })

  useTicketStore.setState({
    tickets: [],
    selectedTicket: null,
    isLoading: false,
    filter: "open",
    searchParam: ""
  })

  useChatStore.setState({
    messages: [],
    isLoading: false,
    hasMore: false,
    page: 1,
    currentTicketId: null
  })

  useNotificationStore.setState({
    notifications: [],
    unreadCount: 0
  })
}

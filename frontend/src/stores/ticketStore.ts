import { create } from "zustand"
import api from "@/lib/api"
import type { Ticket, PaginatedResponse } from "@/types"

type TicketFilter = "open" | "pending" | "closed" | "all"

interface TicketState {
  tickets: Ticket[]
  selectedTicket: Ticket | null
  isLoading: boolean
  filter: TicketFilter
  searchParam: string
  whatsappId: number | null
  fetchTickets: () => Promise<void>
  selectTicket: (ticket: Ticket) => void
  setFilter: (filter: TicketFilter) => void
  setSearchParam: (param: string) => void
  setWhatsappId: (id: number | null) => void
  addTicket: (ticket: Ticket) => void
  updateTicket: (ticket: Ticket) => void
  removeTicket: (ticketId: number) => void
  clearSelection: () => void
}

export const useTicketStore = create<TicketState>()((set, get) => ({
  tickets: [],
  selectedTicket: null,
  isLoading: false,
  filter: "open",
  searchParam: "",
  whatsappId: null,

  fetchTickets: async () => {
    try {
      set({ isLoading: true })

      const { filter, searchParam, whatsappId } = get()
      const params: Record<string, string | number> = {
        pageNumber: 1,
        limit: 100
      }

      if (filter !== "all") {
        params.status = filter
      }

      if (searchParam) {
        params.search = searchParam
      }

      if (whatsappId) {
        params.whatsappId = whatsappId
      }

      const response = await api.get<PaginatedResponse<Ticket>>(
        "/tickets",
        { params }
      )

      if (!response.data.success) {
        set({ tickets: [], isLoading: false })
        return
      }

      set({
        tickets: Array.isArray(response.data.data) ? response.data.data : [],
        isLoading: false
      })
    } catch {
      set({ tickets: [], isLoading: false })
    }
  },

  selectTicket: (ticket: Ticket) => {
    set({ selectedTicket: ticket })
  },

  setFilter: (filter: "open" | "pending" | "closed" | "all") => {
    set({ filter })
    get().fetchTickets()
  },

  setSearchParam: (param: string) => {
    set({ searchParam: param })
  },

  setWhatsappId: (id: number | null) => {
    set({ whatsappId: id })
    get().fetchTickets()
  },

  addTicket: (ticket: Ticket) => {
    set((state) => {
      const exists = state.tickets.some((t) => t.id === ticket.id)
      if (exists) return state

      const { filter, whatsappId } = state

      const matchesFilter =
        filter === "all" || ticket.status === filter
      const matchesWhatsApp =
        !whatsappId || ticket.whatsappId === whatsappId

      if (!matchesFilter || !matchesWhatsApp) return state

      return { tickets: [ticket, ...state.tickets] }
    })
  },

  updateTicket: (updatedTicket: Ticket) => {
    set((state) => {
      const updatedTickets = state.tickets.map((ticket) => {
        if (ticket.id !== updatedTicket.id) return ticket
        return {
          ...ticket,
          ...updatedTicket,
          contact: updatedTicket.contact || ticket.contact,
          user: updatedTicket.user || ticket.user,
          queue: updatedTicket.queue || ticket.queue,
          whatsapp: updatedTicket.whatsapp || ticket.whatsapp
        }
      })

      const updatedSelectedTicket =
        state.selectedTicket?.id === updatedTicket.id
          ? {
              ...state.selectedTicket,
              ...updatedTicket,
              contact: updatedTicket.contact || state.selectedTicket.contact,
              user: updatedTicket.user || state.selectedTicket.user,
              queue: updatedTicket.queue || state.selectedTicket.queue,
              whatsapp: updatedTicket.whatsapp || state.selectedTicket.whatsapp
            }
          : state.selectedTicket

      return {
        tickets: updatedTickets,
        selectedTicket: updatedSelectedTicket
      }
    })
  },

  removeTicket: (ticketId: number) => {
    set((state) => ({
      tickets: state.tickets.filter((t) => t.id !== ticketId),
      selectedTicket:
        state.selectedTicket?.id === ticketId ? null : state.selectedTicket
    }))
  },

  clearSelection: () => {
    set({ selectedTicket: null })
  }
}))

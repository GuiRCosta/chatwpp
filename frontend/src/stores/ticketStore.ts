import { create } from "zustand"
import api from "@/lib/api"
import type { Ticket, PaginatedResponse } from "@/types"

interface TicketState {
  tickets: Ticket[]
  selectedTicket: Ticket | null
  isLoading: boolean
  filter: "open" | "pending" | "closed" | "all"
  searchParam: string
  whatsappId: number | null
  fetchTickets: () => Promise<void>
  selectTicket: (ticket: Ticket) => void
  setFilter: (filter: "open" | "pending" | "closed" | "all") => void
  setSearchParam: (param: string) => void
  setWhatsappId: (id: number | null) => void
  updateTicket: (ticket: Ticket) => void
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

  updateTicket: (updatedTicket: Ticket) => {
    set((state) => {
      const updatedTickets = state.tickets.map((ticket) =>
        ticket.id === updatedTicket.id ? updatedTicket : ticket
      )

      const updatedSelectedTicket =
        state.selectedTicket?.id === updatedTicket.id
          ? updatedTicket
          : state.selectedTicket

      return {
        tickets: updatedTickets,
        selectedTicket: updatedSelectedTicket
      }
    })
  },

  clearSelection: () => {
    set({ selectedTicket: null })
  }
}))

import { create } from "zustand"
import api from "@/lib/api"
import type { Ticket, PaginatedResponse } from "@/types"

interface TicketState {
  tickets: Ticket[]
  selectedTicket: Ticket | null
  isLoading: boolean
  filter: "open" | "pending" | "closed" | "all"
  searchParam: string
  fetchTickets: () => Promise<void>
  selectTicket: (ticket: Ticket) => void
  setFilter: (filter: "open" | "pending" | "closed" | "all") => void
  setSearchParam: (param: string) => void
  updateTicket: (ticket: Ticket) => void
  clearSelection: () => void
}

export const useTicketStore = create<TicketState>()((set, get) => ({
  tickets: [],
  selectedTicket: null,
  isLoading: false,
  filter: "open",
  searchParam: "",

  fetchTickets: async () => {
    try {
      set({ isLoading: true })

      const { filter, searchParam } = get()
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
    // Auto-fetch with new filter
    get().fetchTickets()
  },

  setSearchParam: (param: string) => {
    set({ searchParam: param })
  },

  updateTicket: (updatedTicket: Ticket) => {
    set((state) => {
      const updatedTickets = state.tickets.map((ticket) =>
        ticket.id === updatedTicket.id ? updatedTicket : ticket
      )

      // Also update selected ticket if it matches
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

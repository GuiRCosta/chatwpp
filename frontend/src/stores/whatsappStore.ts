import { create } from "zustand"
import api from "@/lib/api"
import type { WhatsApp } from "@/types"

interface WhatsAppListResponse {
  success: boolean
  data: WhatsApp[]
  meta?: {
    connectionCount: number
    maxConnections: number
  }
}

interface WhatsAppState {
  connections: WhatsApp[]
  maxConnections: number
  connectionCount: number
  isLoading: boolean
  fetchConnections: () => Promise<void>
  addConnection: (connection: WhatsApp) => void
  updateConnection: (connection: WhatsApp) => void
  removeConnection: (id: number) => void
}

export const useWhatsAppStore = create<WhatsAppState>()((set) => ({
  connections: [],
  maxConnections: 99,
  connectionCount: 0,
  isLoading: false,

  fetchConnections: async () => {
    try {
      set({ isLoading: true })
      const response = await api.get<WhatsAppListResponse>("/whatsapp")
      const connections = Array.isArray(response.data.data)
        ? response.data.data
        : []
      const meta = response.data.meta

      set({
        connections,
        connectionCount: meta?.connectionCount ?? connections.length,
        maxConnections: meta?.maxConnections ?? 99,
        isLoading: false
      })
    } catch {
      set({ isLoading: false })
    }
  },

  addConnection: (connection: WhatsApp) => {
    set((state) => {
      const exists = state.connections.some((c) => c.id === connection.id)
      if (exists) return state
      const connections = [...state.connections, connection]
      return {
        connections,
        connectionCount: connections.length
      }
    })
  },

  updateConnection: (updated: WhatsApp) => {
    set((state) => ({
      connections: state.connections.map((c) =>
        c.id === updated.id ? updated : c
      )
    }))
  },

  removeConnection: (id: number) => {
    set((state) => {
      const connections = state.connections.filter((c) => c.id !== id)
      return {
        connections,
        connectionCount: connections.length
      }
    })
  }
}))

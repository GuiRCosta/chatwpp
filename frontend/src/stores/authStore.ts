import axios from "axios"
import { create } from "zustand"
import api from "@/lib/api"
import { connectSocket, disconnectSocket } from "@/lib/socket"
import type { User, ApiResponse } from "@/types"

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  setToken: (token: string) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  setToken: (token: string) => {
    set({ token })
  },

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true })

      const response = await api.post<
        ApiResponse<{
          token: string
          user: User
        }>
      >("/auth/login", { email, password })

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || "Login failed")
      }

      const { token, user } = response.data.data

      set({
        user,
        token,
        isAuthenticated: true,
        isInitialized: true,
        isLoading: false
      })

      connectSocket(token)
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout")
    } catch {
      // Logout request may fail if token expired
    } finally {
      disconnectSocket()

      set({
        user: null,
        token: null,
        isAuthenticated: false
      })
    }
  },

  initialize: async () => {
    if (get().isInitialized) return

    // Cleanup legacy localStorage tokens
    localStorage.removeItem("nuvio:token")
    localStorage.removeItem("nuvio:refreshToken")
    localStorage.removeItem("nuvio:user")

    try {
      // Use raw axios (no interceptors) to avoid refresh-retry loop
      const refreshRes = await axios.post<ApiResponse<{ token: string }>>(
        "/api/auth/refresh",
        {},
        { withCredentials: true }
      )

      if (!refreshRes.data.success || !refreshRes.data.data) {
        set({ isInitialized: true })
        return
      }

      const { token } = refreshRes.data.data
      set({ token })

      // Fetch user data with the new token
      const meRes = await axios.get<ApiResponse<{ user: User }>>("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!meRes.data.success || !meRes.data.data) {
        set({ token: null, isInitialized: true })
        return
      }

      set({
        user: meRes.data.data.user,
        token,
        isAuthenticated: true,
        isInitialized: true
      })

      connectSocket(token)
    } catch {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isInitialized: true
      })
    }
  }
}))

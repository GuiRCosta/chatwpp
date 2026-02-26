import { create } from "zustand"
import api from "@/lib/api"
import { connectSocket, disconnectSocket } from "@/lib/socket"
import type { User, ApiResponse } from "@/types"

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  initialize: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true })

      const response = await api.post<
        ApiResponse<{
          token: string
          refreshToken: string
          user: User
        }>
      >("/auth/login", { email, password })

      if (!response.data.success) {
        throw new Error(response.data.error || "Login failed")
      }

      const { token, refreshToken, user } = response.data.data

      // Store in localStorage
      localStorage.setItem("zflow:token", token)
      localStorage.setItem("zflow:refreshToken", refreshToken)
      localStorage.setItem("zflow:user", JSON.stringify(user))

      // Update state
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false
      })

      // Connect socket
      connectSocket(token)
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout")
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Clear localStorage
      localStorage.removeItem("zflow:token")
      localStorage.removeItem("zflow:refreshToken")
      localStorage.removeItem("zflow:user")

      // Disconnect socket
      disconnectSocket()

      // Clear state
      set({
        user: null,
        token: null,
        isAuthenticated: false
      })
    }
  },

  initialize: () => {
    const token = localStorage.getItem("zflow:token")
    const userStr = localStorage.getItem("zflow:user")

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User

        set({
          user,
          token,
          isAuthenticated: true
        })

        // Reconnect socket
        connectSocket(token)
      } catch (error) {
        console.error("Failed to initialize auth state:", error)
        // Clear invalid data
        localStorage.removeItem("zflow:token")
        localStorage.removeItem("zflow:refreshToken")
        localStorage.removeItem("zflow:user")
      }
    }
  }
}))

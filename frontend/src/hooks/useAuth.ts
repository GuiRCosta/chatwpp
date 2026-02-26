import { useEffect } from "react"
import { useAuthStore } from "@/stores/authStore"

export function useAuth() {
  const { user, token, isAuthenticated, isLoading, login, logout, initialize } =
    useAuthStore()

  // Initialize auth state on mount
  useEffect(() => {
    initialize()
  }, [initialize])

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout
  }
}

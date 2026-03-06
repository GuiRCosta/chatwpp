import { useAuthStore } from "@/stores/authStore"

export function useAuth() {
  const { user, token, isAuthenticated, isLoading, isInitialized, login, logout } =
    useAuthStore()

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    isInitialized,
    login,
    logout
  }
}

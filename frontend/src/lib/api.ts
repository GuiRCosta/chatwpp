import axios from "axios"
import { useAuthStore } from "@/stores/authStore"

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json"
  }
})

// Request interceptor: add Bearer token from Zustand store (memory)
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Refresh token lock — only one refresh at a time, others wait
let refreshPromise: Promise<string | null> | null = null

function refreshToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise

  refreshPromise = axios
    .post("/api/auth/refresh", {}, { withCredentials: true })
    .then((response) => {
      if (response.data.success && response.data.data?.token) {
        const { token } = response.data.data
        useAuthStore.getState().setToken(token)
        return token
      }
      return null
    })
    .catch(() => null)
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

// Response interceptor: on 401, try refresh via httpOnly cookie
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    const isRefreshRequest = originalRequest.url?.includes("/auth/refresh")

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshRequest) {
      originalRequest._retry = true

      const newToken = await refreshToken()

      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      }

      useAuthStore.setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isInitialized: true
      })

      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

export default api

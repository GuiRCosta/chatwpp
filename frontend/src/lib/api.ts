import axios from "axios"
import { useAuthStore } from "@/stores/authStore"

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
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

// Response interceptor: on 401, try refresh via httpOnly cookie
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    const isRefreshRequest = originalRequest.url?.includes("/auth/refresh")

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshRequest) {
      originalRequest._retry = true

      try {
        const response = await axios.post(
          "/api/auth/refresh",
          {},
          { withCredentials: true }
        )

        if (response.data.success) {
          const { token } = response.data.data

          useAuthStore.getState().setToken(token)

          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }
      } catch {
        useAuthStore.setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isInitialized: true
        })

        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default api

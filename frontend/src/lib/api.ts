import axios from "axios"

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json"
  }
})

// Request interceptor: add Bearer token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("zflow:token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor: on 401, try refresh token, if fails redirect to /login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem("zflow:refreshToken")

        if (!refreshToken) {
          throw new Error("No refresh token available")
        }

        const response = await axios.post("/api/auth/refresh", {
          refreshToken
        })

        if (response.data.success) {
          const { token, refreshToken: newRefreshToken } = response.data.data

          localStorage.setItem("zflow:token", token)
          localStorage.setItem("zflow:refreshToken", newRefreshToken)

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem("zflow:token")
        localStorage.removeItem("zflow:refreshToken")
        localStorage.removeItem("zflow:user")

        window.location.href = "/login"
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api

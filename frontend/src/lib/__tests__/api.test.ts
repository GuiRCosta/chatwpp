import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/__tests__/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import api from "@/lib/api"

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }))
afterEach(() => {
  server.resetHandlers()
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false
  })
  window.location.href = "http://localhost:7564"
})
afterAll(() => server.close())

describe("api", () => {
  describe("request interceptor", () => {
    it("adds Bearer token from Zustand store when token exists", async () => {
      let capturedAuth = ""

      useAuthStore.setState({ token: "my-jwt-token" })

      server.use(
        http.get("/api/test-auth", ({ request }) => {
          capturedAuth = request.headers.get("Authorization") || ""
          return HttpResponse.json({ success: true, data: null })
        })
      )

      await api.get("/test-auth")

      expect(capturedAuth).toBe("Bearer my-jwt-token")
    })

    it("does not add Authorization header when no token in store", async () => {
      let capturedAuth: string | null = ""

      server.use(
        http.get("/api/test-no-auth", ({ request }) => {
          capturedAuth = request.headers.get("Authorization")
          return HttpResponse.json({ success: true, data: null })
        })
      )

      await api.get("/test-no-auth")

      expect(capturedAuth).toBeNull()
    })
  })

  describe("response interceptor", () => {
    it("on 401, attempts refresh via cookie and retries original request", async () => {
      let attempt = 0

      useAuthStore.setState({ token: "expired-token" })

      server.use(
        http.get("/api/protected-resource", () => {
          attempt += 1
          if (attempt === 1) {
            return HttpResponse.json(
              { success: false, error: "Unauthorized" },
              { status: 401 }
            )
          }
          return HttpResponse.json({
            success: true,
            data: { value: "protected-data" }
          })
        }),
        http.post("/api/auth/refresh", () => {
          return HttpResponse.json({
            success: true,
            data: {
              token: "new-jwt-token"
            }
          })
        })
      )

      const response = await api.get("/protected-resource")

      expect(response.data.success).toBe(true)
      expect(response.data.data.value).toBe("protected-data")
      expect(useAuthStore.getState().token).toBe("new-jwt-token")
    })

    it("on refresh failure, clears store state (PrivateRoute handles redirect)", async () => {
      useAuthStore.setState({ token: "expired-token", isAuthenticated: true })

      server.use(
        http.get("/api/secure-endpoint", () => {
          return HttpResponse.json(
            { success: false, error: "Unauthorized" },
            { status: 401 }
          )
        }),
        http.post("/api/auth/refresh", () => {
          return HttpResponse.json(
            { success: false, error: "Invalid refresh token" },
            { status: 401 }
          )
        })
      )

      await expect(api.get("/secure-endpoint")).rejects.toThrow()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isInitialized).toBe(true)
    })

    it("passes through non-401 errors without refresh attempt", async () => {
      server.use(
        http.get("/api/server-error", () => {
          return HttpResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
          )
        })
      )

      await expect(api.get("/server-error")).rejects.toThrow()

      expect(useAuthStore.getState().token).toBeNull()
    })
  })
})

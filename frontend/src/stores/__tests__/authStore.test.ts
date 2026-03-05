import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest"
import { server } from "@/__tests__/mocks/server"
import { resetAllStores } from "@/__tests__/utils/storeReset"
import { http, HttpResponse } from "msw"
import { useAuthStore } from "@/stores/authStore"

vi.mock("@/lib/socket", () => ({
  connectSocket: vi.fn().mockReturnValue({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn()
  }),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn().mockReturnValue(null)
}))

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => {
  server.resetHandlers()
  resetAllStores()
  localStorage.clear()
  window.location.href = "http://localhost:7564"
})
afterAll(() => server.close())

describe("authStore", () => {
  describe("initial state", () => {
    it("has user set to null", () => {
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
    })

    it("has token set to null", () => {
      const state = useAuthStore.getState()
      expect(state.token).toBeNull()
    })

    it("has isAuthenticated set to false", () => {
      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
    })

    it("has isLoading set to false", () => {
      const state = useAuthStore.getState()
      expect(state.isLoading).toBe(false)
    })

    it("has isInitialized set to false", () => {
      const state = useAuthStore.getState()
      expect(state.isInitialized).toBe(false)
    })
  })

  describe("login", () => {
    it("sets user, token, and isAuthenticated on success", async () => {
      await useAuthStore.getState().login("test@example.com", "password123")

      const state = useAuthStore.getState()
      expect(state.user).toEqual({
        id: 1,
        tenantId: 1,
        name: "Test User",
        email: "test@example.com",
        profile: "admin",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z"
      })
      expect(state.token).toBe("test-jwt-token")
      expect(state.isAuthenticated).toBe(true)
      expect(state.isLoading).toBe(false)
    })

    it("does not store tokens in localStorage", async () => {
      await useAuthStore.getState().login("test@example.com", "password123")

      expect(localStorage.setItem).not.toHaveBeenCalledWith(
        "nuvio:token",
        expect.any(String)
      )
      expect(localStorage.setItem).not.toHaveBeenCalledWith(
        "nuvio:refreshToken",
        expect.any(String)
      )
    })

    it("calls connectSocket with token", async () => {
      const { connectSocket } = await import("@/lib/socket")

      await useAuthStore.getState().login("test@example.com", "password123")

      expect(connectSocket).toHaveBeenCalledWith("test-jwt-token")
    })

    it("resets isLoading on error", async () => {
      server.use(
        http.post("/api/auth/login", () => {
          return HttpResponse.json(
            { success: false, error: "Invalid credentials" },
            { status: 401 }
          )
        })
      )

      await expect(
        useAuthStore.getState().login("bad@example.com", "wrong")
      ).rejects.toThrow()

      const state = useAuthStore.getState()
      expect(state.isLoading).toBe(false)
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe("logout", () => {
    const authenticatedUser = {
      id: 1,
      tenantId: 1,
      name: "Test User",
      email: "test@example.com",
      profile: "admin",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    }

    it("clears state", async () => {
      useAuthStore.setState({
        user: authenticatedUser,
        token: "test-jwt-token",
        isAuthenticated: true,
        isLoading: false
      })

      await useAuthStore.getState().logout()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })

    it("calls disconnectSocket", async () => {
      const { disconnectSocket } = await import("@/lib/socket")

      useAuthStore.setState({
        user: authenticatedUser,
        token: "test-jwt-token",
        isAuthenticated: true,
        isLoading: false
      })

      await useAuthStore.getState().logout()

      expect(disconnectSocket).toHaveBeenCalled()
    })
  })

  describe("initialize", () => {
    it("restores session via refresh cookie and /auth/me", async () => {
      await useAuthStore.getState().initialize()

      const state = useAuthStore.getState()
      expect(state.token).toBe("new-test-jwt-token")
      expect(state.user).toEqual({
        id: 1,
        tenantId: 1,
        name: "Test User",
        email: "test@example.com",
        profile: "admin",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z"
      })
      expect(state.isAuthenticated).toBe(true)
      expect(state.isInitialized).toBe(true)
    })

    it("calls connectSocket with new token", async () => {
      const { connectSocket } = await import("@/lib/socket")

      await useAuthStore.getState().initialize()

      expect(connectSocket).toHaveBeenCalledWith("new-test-jwt-token")
    })

    it("sets isInitialized true when refresh fails", async () => {
      server.use(
        http.post("/api/auth/refresh", () => {
          return HttpResponse.json(
            { success: false, error: "No refresh token" },
            { status: 401 }
          )
        })
      )

      await useAuthStore.getState().initialize()

      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isInitialized).toBe(true)
      expect(state.user).toBeNull()
    })

    it("sets isInitialized true when refresh returns no data", async () => {
      server.use(
        http.post("/api/auth/refresh", () => {
          return HttpResponse.json({ success: false })
        })
      )

      await useAuthStore.getState().initialize()

      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isInitialized).toBe(true)
    })

    it("clears token when /auth/me fails after refresh", async () => {
      server.use(
        http.get("/api/auth/me", () => {
          return HttpResponse.json(
            { success: false, error: "Unauthorized" },
            { status: 401 }
          )
        })
      )

      await useAuthStore.getState().initialize()

      const state = useAuthStore.getState()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isInitialized).toBe(true)
    })

    it("cleans up legacy localStorage tokens", async () => {
      localStorage.setItem("nuvio:token", "old-token")
      localStorage.setItem("nuvio:refreshToken", "old-refresh")
      localStorage.setItem("nuvio:user", '{"id":1}')

      await useAuthStore.getState().initialize()

      expect(localStorage.removeItem).toHaveBeenCalledWith("nuvio:token")
      expect(localStorage.removeItem).toHaveBeenCalledWith("nuvio:refreshToken")
      expect(localStorage.removeItem).toHaveBeenCalledWith("nuvio:user")
    })
  })

  describe("setToken", () => {
    it("updates token in state", () => {
      useAuthStore.getState().setToken("new-token")

      expect(useAuthStore.getState().token).toBe("new-token")
    })
  })
})

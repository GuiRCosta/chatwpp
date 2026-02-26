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

    it("stores token, refreshToken, and user in localStorage", async () => {
      await useAuthStore.getState().login("test@example.com", "password123")

      expect(localStorage.setItem).toHaveBeenCalledWith("zflow:token", "test-jwt-token")
      expect(localStorage.setItem).toHaveBeenCalledWith("zflow:refreshToken", "test-refresh-token")
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "zflow:user",
        expect.stringContaining('"name":"Test User"')
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
      localStorage.setItem("zflow:token", "test-jwt-token")

      await useAuthStore.getState().logout()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })

    it("removes from localStorage", async () => {
      useAuthStore.setState({
        user: authenticatedUser,
        token: "test-jwt-token",
        isAuthenticated: true,
        isLoading: false
      })
      localStorage.setItem("zflow:token", "test-jwt-token")

      await useAuthStore.getState().logout()

      expect(localStorage.removeItem).toHaveBeenCalledWith("zflow:token")
      expect(localStorage.removeItem).toHaveBeenCalledWith("zflow:refreshToken")
      expect(localStorage.removeItem).toHaveBeenCalledWith("zflow:user")
    })

    it("calls disconnectSocket", async () => {
      const { disconnectSocket } = await import("@/lib/socket")

      useAuthStore.setState({
        user: authenticatedUser,
        token: "test-jwt-token",
        isAuthenticated: true,
        isLoading: false
      })
      localStorage.setItem("zflow:token", "test-jwt-token")

      await useAuthStore.getState().logout()

      expect(disconnectSocket).toHaveBeenCalled()
    })
  })

  describe("initialize", () => {
    it("hydrates state from localStorage", () => {
      const user = {
        id: 1,
        tenantId: 1,
        name: "Test User",
        email: "test@example.com",
        profile: "admin",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z"
      }

      localStorage.setItem("zflow:token", "stored-token")
      localStorage.setItem("zflow:user", JSON.stringify(user))

      useAuthStore.getState().initialize()

      const state = useAuthStore.getState()
      expect(state.user).toEqual(user)
      expect(state.token).toBe("stored-token")
      expect(state.isAuthenticated).toBe(true)
    })

    it("calls connectSocket with stored token", async () => {
      const { connectSocket } = await import("@/lib/socket")

      localStorage.setItem("zflow:token", "stored-token")
      localStorage.setItem("zflow:user", JSON.stringify({ id: 1, name: "Test" }))

      useAuthStore.getState().initialize()

      expect(connectSocket).toHaveBeenCalledWith("stored-token")
    })

    it("clears localStorage on invalid JSON", () => {
      localStorage.setItem("zflow:token", "stored-token")
      localStorage.setItem("zflow:user", "invalid-json{{{")

      useAuthStore.getState().initialize()

      expect(localStorage.removeItem).toHaveBeenCalledWith("zflow:token")
      expect(localStorage.removeItem).toHaveBeenCalledWith("zflow:refreshToken")
      expect(localStorage.removeItem).toHaveBeenCalledWith("zflow:user")

      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
    })

    it("does nothing when no token in localStorage", () => {
      useAuthStore.getState().initialize()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })
})

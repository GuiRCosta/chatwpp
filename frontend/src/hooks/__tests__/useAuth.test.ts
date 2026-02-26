import { describe, it, expect, vi, afterEach } from "vitest"
import { renderHook } from "@testing-library/react"
import { useAuth } from "@/hooks/useAuth"
import { useAuthStore } from "@/stores/authStore"
import { resetAllStores } from "@/__tests__/utils/storeReset"

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

afterEach(() => {
  resetAllStores()
})

describe("useAuth", () => {
  it("returns auth state from store", () => {
    useAuthStore.setState({
      user: {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        profile: "admin",
        tenantId: 1,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z"
      },
      token: "test-token",
      isAuthenticated: true,
      isLoading: false
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.user?.name).toBe("Test User")
    expect(result.current.token).toBe("test-token")
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.login).toBeDefined()
    expect(result.current.logout).toBeDefined()
  })

  it("calls initialize on mount", () => {
    const initializeSpy = vi.fn()
    const originalState = useAuthStore.getState()

    useAuthStore.setState({
      ...originalState,
      initialize: initializeSpy
    })

    renderHook(() => useAuth())

    expect(initializeSpy).toHaveBeenCalledTimes(1)
  })

  it("returns default unauthenticated state", () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })
})

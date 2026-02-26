import { describe, it, expect, vi, afterEach } from "vitest"
import { renderHook } from "@testing-library/react"
import { useSocket } from "@/hooks/useSocket"
import { useAuthStore } from "@/stores/authStore"
import { resetAllStores } from "@/__tests__/utils/storeReset"

const mockSocketInstance = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn()
}

vi.mock("@/lib/socket", () => ({
  connectSocket: vi.fn().mockReturnValue({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn()
  }),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => mockSocketInstance)
}))

afterEach(() => {
  resetAllStores()
  vi.clearAllMocks()
})

describe("useSocket", () => {
  it("sets up socket connection when authenticated", async () => {
    const { getSocket } = await import("@/lib/socket")

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

    renderHook(() => useSocket())

    expect(getSocket).toHaveBeenCalled()
    expect(mockSocketInstance.on).toHaveBeenCalledWith(
      "notification:created",
      expect.any(Function)
    )
    expect(mockSocketInstance.on).toHaveBeenCalledWith(
      "ticket:updated",
      expect.any(Function)
    )
    expect(mockSocketInstance.on).toHaveBeenCalledWith(
      "message:created",
      expect.any(Function)
    )
  })

  it("cleans up listeners on unmount", async () => {
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

    const { unmount } = renderHook(() => useSocket())

    unmount()

    expect(mockSocketInstance.off).toHaveBeenCalledWith("notification:created")
    expect(mockSocketInstance.off).toHaveBeenCalledWith("ticket:updated")
    expect(mockSocketInstance.off).toHaveBeenCalledWith("message:created")
  })

  it("does nothing when not authenticated", async () => {
    const { getSocket } = await import("@/lib/socket")

    vi.mocked(getSocket).mockReturnValue(null)

    renderHook(() => useSocket())

    expect(mockSocketInstance.on).not.toHaveBeenCalled()
  })
})

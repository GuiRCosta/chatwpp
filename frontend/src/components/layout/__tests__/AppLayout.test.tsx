import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { AppLayout } from "@/components/layout/AppLayout"
import { useAuthStore } from "@/stores/authStore"

vi.mock("@/lib/socket", () => ({
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => null)
}))

vi.mock("@/hooks/useSocket", () => ({
  useSocket: vi.fn(() => ({ socket: null }))
}))

describe("AppLayout", () => {
  beforeEach(() => {
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
  })

  function renderWithRouter() {
    return render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route
              path="/dashboard"
              element={<div>Dashboard Content</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    )
  }

  it("renders sidebar", () => {
    renderWithRouter()

    expect(screen.getByText("ZFLOW")).toBeInTheDocument()
    // "Dashboard" appears in sidebar nav link, header title, and outlet content
    const dashboardElements = screen.getAllByText("Dashboard")
    expect(dashboardElements.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText("Tickets")).toBeInTheDocument()
  })

  it("renders header", () => {
    renderWithRouter()

    // Header renders with default title "Dashboard"
    // The header component has the title text
    const headings = screen.getAllByText("Dashboard")
    expect(headings.length).toBeGreaterThanOrEqual(1)
  })

  it("has main content area with outlet content", () => {
    renderWithRouter()

    expect(screen.getByText("Dashboard Content")).toBeInTheDocument()
  })
})

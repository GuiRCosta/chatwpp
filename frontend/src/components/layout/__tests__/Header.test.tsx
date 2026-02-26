import { describe, it, expect, vi } from "vitest"
import { render, screen, userEvent, waitFor } from "@/__tests__/utils/render"
import { Header } from "@/components/layout/Header"
import { useAuthStore } from "@/stores/authStore"
import { useNotificationStore } from "@/stores/notificationStore"

vi.mock("@/lib/socket", () => ({
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => null)
}))

const mockNavigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

describe("Header", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 1,
        name: "Maria Silva",
        email: "maria@example.com",
        profile: "admin",
        tenantId: 1,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z"
      },
      token: "test-token",
      isAuthenticated: true,
      isLoading: false
    })

    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0
    })
  })

  it("renders user name in dropdown menu", async () => {
    render(<Header />)

    const user = userEvent.setup()

    // Click the avatar trigger to open the dropdown
    const avatarButton = screen.getByText("MS").closest("button")!
    await user.click(avatarButton)

    await waitFor(() => {
      expect(screen.getByText("Maria Silva")).toBeInTheDocument()
    })
  })

  it("renders user email in dropdown menu", async () => {
    render(<Header />)

    const user = userEvent.setup()

    const avatarButton = screen.getByText("MS").closest("button")!
    await user.click(avatarButton)

    await waitFor(() => {
      expect(screen.getByText("maria@example.com")).toBeInTheDocument()
    })
  })

  it("renders default title", () => {
    render(<Header />)

    expect(screen.getByText("Dashboard")).toBeInTheDocument()
  })

  it("renders custom title", () => {
    render(<Header title="Tickets" />)

    expect(screen.getByText("Tickets")).toBeInTheDocument()
  })

  it("shows notification count when unread notifications exist", () => {
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 5
    })

    render(<Header />)

    expect(screen.getByText("5")).toBeInTheDocument()
  })

  it("shows 9+ when unread count exceeds 9", () => {
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 15
    })

    render(<Header />)

    expect(screen.getByText("9+")).toBeInTheDocument()
  })

  it("does not show notification badge when unread count is 0", () => {
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0
    })

    render(<Header />)

    expect(screen.queryByText("0")).not.toBeInTheDocument()
  })

  it("renders user initials in avatar fallback", () => {
    render(<Header />)

    expect(screen.getByText("MS")).toBeInTheDocument()
  })

  it("renders U as fallback initial when user is null", () => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false
    })

    render(<Header />)

    expect(screen.getByText("U")).toBeInTheDocument()
  })

  it("navigates to /notifications when bell icon is clicked", async () => {
    render(<Header />)

    const user = userEvent.setup()
    const bellButton = screen.getByRole("button", { name: "" })
    await user.click(bellButton)

    expect(mockNavigate).toHaveBeenCalledWith("/notifications")
  })

  it("calls logout and navigates to /login when Sair is clicked", async () => {
    const mockLogout = vi.fn().mockResolvedValue(undefined)
    useAuthStore.setState({
      user: {
        id: 1,
        name: "Maria Silva",
        email: "maria@example.com",
        profile: "admin",
        tenantId: 1,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z"
      },
      token: "test-token",
      isAuthenticated: true,
      isLoading: false,
      logout: mockLogout
    })

    render(<Header />)

    const user = userEvent.setup()
    const avatarButton = screen.getByText("MS").closest("button")!
    await user.click(avatarButton)

    await waitFor(() => {
      expect(screen.getByText("Sair")).toBeInTheDocument()
    })

    await user.click(screen.getByText("Sair"))

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled()
    })
    expect(mockNavigate).toHaveBeenCalledWith("/login")
  })

  it("navigates to /profile when Perfil is clicked", async () => {
    render(<Header />)

    const user = userEvent.setup()
    const avatarButton = screen.getByText("MS").closest("button")!
    await user.click(avatarButton)

    await waitFor(() => {
      expect(screen.getByText("Perfil")).toBeInTheDocument()
    })

    await user.click(screen.getByText("Perfil"))

    expect(mockNavigate).toHaveBeenCalledWith("/profile")
  })

  it("navigates to /settings when Configuracoes is clicked", async () => {
    render(<Header />)

    const user = userEvent.setup()
    const avatarButton = screen.getByText("MS").closest("button")!
    await user.click(avatarButton)

    await waitFor(() => {
      expect(screen.getByText("Configuracoes")).toBeInTheDocument()
    })

    await user.click(screen.getByText("Configuracoes"))

    expect(mockNavigate).toHaveBeenCalledWith("/settings")
  })
})

import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@/__tests__/utils/render"
import { Sidebar } from "@/components/layout/Sidebar"
import { useAuthStore } from "@/stores/authStore"

vi.mock("@/lib/socket", () => ({
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => null)
}))

describe("Sidebar", () => {
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

  it("renders all navigation links", () => {
    render(<Sidebar />)

    expect(screen.getByText("Dashboard")).toBeInTheDocument()
    expect(screen.getByText("Tickets")).toBeInTheDocument()
    expect(screen.getByText("Contatos")).toBeInTheDocument()
    expect(screen.getByText("CRM")).toBeInTheDocument()
    expect(screen.getByText("Campanhas")).toBeInTheDocument()
    expect(screen.getByText("Configuracoes")).toBeInTheDocument()
  })

  it("contains expected link text and navigation paths", () => {
    render(<Sidebar />)

    const dashboardLink = screen.getByText("Dashboard").closest("a")
    expect(dashboardLink).toHaveAttribute("href", "/dashboard")

    const ticketsLink = screen.getByText("Tickets").closest("a")
    expect(ticketsLink).toHaveAttribute("href", "/tickets")

    const contactsLink = screen.getByText("Contatos").closest("a")
    expect(contactsLink).toHaveAttribute("href", "/contacts")

    const crmLink = screen.getByText("CRM").closest("a")
    expect(crmLink).toHaveAttribute("href", "/crm")

    const campaignsLink = screen.getByText("Campanhas").closest("a")
    expect(campaignsLink).toHaveAttribute("href", "/campaigns")
  })

  it("renders the ZFLOW logo text", () => {
    render(<Sidebar />)

    expect(screen.getByText("ZFLOW")).toBeInTheDocument()
  })

  it("renders the logout button", () => {
    render(<Sidebar />)

    expect(screen.getByText("Sair")).toBeInTheDocument()
  })

  it("displays user name from auth store", () => {
    render(<Sidebar />)

    expect(screen.getByText("Test User")).toBeInTheDocument()
  })
})

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest"
import { render, screen, waitFor } from "@/__tests__/utils/render"
import { Dashboard } from "@/pages/Dashboard"
import { server } from "@/__tests__/mocks/server"

vi.mock("@/lib/socket", () => ({
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => null)
}))

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe("Dashboard", () => {
  it("shows loading state initially", () => {
    render(<Dashboard />)

    // The stat cards show skeleton loaders (animate-pulse divs) while loading
    const { container } = render(<Dashboard />)
    const pulsingElements = container.querySelectorAll(".animate-pulse")
    expect(pulsingElements.length).toBeGreaterThan(0)
  })

  it("shows greeting text", async () => {
    render(<Dashboard />)

    // The greeting is time-dependent: "Bom dia", "Boa tarde", or "Boa noite"
    await waitFor(() => {
      const greetingElement = screen.getByText(/Bom dia|Boa tarde|Boa noite/)
      expect(greetingElement).toBeInTheDocument()
    })
  })

  it("renders stat cards", async () => {
    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText("Tickets Abertos")).toBeInTheDocument()
      expect(screen.getByText("Contatos")).toBeInTheDocument()
      expect(screen.getByText("Campanhas Ativas")).toBeInTheDocument()
      expect(screen.getByText("Oportunidades")).toBeInTheDocument()
    })
  })

  it("renders summary subtitle text", () => {
    render(<Dashboard />)

    expect(
      screen.getByText("Aqui está um resumo das suas atividades")
    ).toBeInTheDocument()
  })
})

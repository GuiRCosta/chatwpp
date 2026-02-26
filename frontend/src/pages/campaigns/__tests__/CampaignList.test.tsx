import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest"
import { http, HttpResponse } from "msw"
import { render, screen, waitFor, userEvent } from "@/__tests__/utils/render"
import { server } from "@/__tests__/mocks/server"
import { resetAllStores } from "@/__tests__/utils/storeReset"
import { CampaignList } from "../CampaignList"

vi.mock("@/lib/socket", () => ({
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn().mockReturnValue(null)
}))

const mockNavigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return { ...actual, useNavigate: () => mockNavigate }
})

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }))
afterEach(() => {
  server.resetHandlers()
  resetAllStores()
  mockNavigate.mockClear()
})
afterAll(() => server.close())

const mockCampaign = {
  id: 1,
  name: "Campanha Teste",
  message: "Mensagem teste",
  status: "pending" as const,
  scheduledAt: "2025-01-15T10:00:00.000Z",
  whatsappId: 1,
  tenantId: 1,
  contacts: [{ contactId: 1 }, { contactId: 2 }],
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z"
}

function setupEmptyCampaignsHandler() {
  server.use(
    http.get("/api/campaigns", () => {
      return HttpResponse.json({
        success: true,
        data: { campaigns: [], count: 0, hasMore: false }
      })
    })
  )
}

function setupCampaignsHandler(opts?: { hasMore?: boolean; count?: number }) {
  const { hasMore = false, count = 1 } = opts ?? {}
  server.use(
    http.get("/api/campaigns", () => {
      return HttpResponse.json({
        success: true,
        data: { campaigns: [mockCampaign], count, hasMore }
      })
    })
  )
}

describe("CampaignList", () => {
  it("renders the page title", async () => {
    setupEmptyCampaignsHandler()
    render(<CampaignList />)

    expect(screen.getByText("Campanhas")).toBeInTheDocument()
  })

  it("shows filter buttons for all statuses", async () => {
    setupEmptyCampaignsHandler()
    render(<CampaignList />)

    expect(screen.getByText("Todas")).toBeInTheDocument()
    expect(screen.getByText("Pendentes")).toBeInTheDocument()
    expect(screen.getByText("Em Andamento")).toBeInTheDocument()
    expect(screen.getByText("Concluídas")).toBeInTheDocument()
    expect(screen.getByText("Pausadas")).toBeInTheDocument()
    expect(screen.getByText("Canceladas")).toBeInTheDocument()
  })

  it("shows search input", async () => {
    setupEmptyCampaignsHandler()
    render(<CampaignList />)

    expect(
      screen.getByPlaceholderText("Buscar campanhas...")
    ).toBeInTheDocument()
  })

  it('shows "Nova Campanha" button', async () => {
    setupEmptyCampaignsHandler()
    render(<CampaignList />)

    expect(screen.getByText("Nova Campanha")).toBeInTheDocument()
  })

  it("shows empty state when no campaigns are returned", async () => {
    setupEmptyCampaignsHandler()
    render(<CampaignList />)

    await waitFor(() => {
      expect(
        screen.getByText("Nenhuma campanha encontrada")
      ).toBeInTheDocument()
    })
  })

  it("renders campaign data when campaigns are returned", async () => {
    setupCampaignsHandler()
    render(<CampaignList />)

    await waitFor(() => {
      expect(screen.getByText("Campanha Teste")).toBeInTheDocument()
    })
  })

  it('navigates to /campaigns/new when "Nova Campanha" button is clicked', async () => {
    setupEmptyCampaignsHandler()
    render(<CampaignList />)

    await waitFor(() => {
      expect(
        screen.getByText("Nenhuma campanha encontrada")
      ).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const buttons = screen.getAllByText("Nova Campanha")
    await user.click(buttons[0])

    expect(mockNavigate).toHaveBeenCalledWith("/campaigns/new")
  })

  it("navigates to campaign detail when row is clicked", async () => {
    setupCampaignsHandler()
    render(<CampaignList />)

    await waitFor(() => {
      expect(screen.getByText("Campanha Teste")).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(screen.getByText("Campanha Teste"))

    expect(mockNavigate).toHaveBeenCalledWith("/campaigns/1")
  })

  it("filters by status when tab is clicked", async () => {
    let lastStatus = ""
    server.use(
      http.get("/api/campaigns", ({ request }) => {
        const url = new URL(request.url)
        lastStatus = url.searchParams.get("status") ?? ""
        return HttpResponse.json({
          success: true,
          data: { campaigns: [], count: 0, hasMore: false }
        })
      })
    )

    render(<CampaignList />)

    const user = userEvent.setup()
    await user.click(screen.getByText("Pendentes"))

    await waitFor(() => {
      expect(lastStatus).toBe("pending")
    })
  })

  it("searches campaigns by term", async () => {
    let lastSearchParam = ""
    server.use(
      http.get("/api/campaigns", ({ request }) => {
        const url = new URL(request.url)
        lastSearchParam = url.searchParams.get("searchParam") ?? ""
        return HttpResponse.json({
          success: true,
          data: { campaigns: [], count: 0, hasMore: false }
        })
      })
    )

    render(<CampaignList />)

    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText("Buscar campanhas..."), "teste")

    await waitFor(() => {
      expect(lastSearchParam).toContain("teste")
    })
  })

  it("shows start button for pending campaign", async () => {
    setupCampaignsHandler()
    render(<CampaignList />)

    await waitFor(() => {
      expect(screen.getByText("Campanha Teste")).toBeInTheDocument()
    })

    expect(screen.getByTitle("Iniciar")).toBeInTheDocument()
  })

  it("starts campaign when start button is clicked", async () => {
    setupCampaignsHandler()
    let startCalled = false
    server.use(
      http.post("/api/campaigns/1/start", () => {
        startCalled = true
        return HttpResponse.json({ success: true })
      })
    )

    render(<CampaignList />)

    await waitFor(() => {
      expect(screen.getByText("Campanha Teste")).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(screen.getByTitle("Iniciar"))

    await waitFor(() => {
      expect(startCalled).toBe(true)
    })
  })

  it("opens delete dialog and deletes campaign", async () => {
    setupCampaignsHandler()
    let deleteCalled = false
    server.use(
      http.delete("/api/campaigns/1", () => {
        deleteCalled = true
        return HttpResponse.json({ success: true })
      })
    )

    render(<CampaignList />)

    await waitFor(() => {
      expect(screen.getByText("Campanha Teste")).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(screen.getByTitle("Excluir"))

    await waitFor(() => {
      expect(screen.getByText("Excluir campanha")).toBeInTheDocument()
    })

    await user.click(screen.getByText("Excluir"))

    await waitFor(() => {
      expect(deleteCalled).toBe(true)
    })
  })

  it("shows pagination controls when campaigns exist", async () => {
    setupCampaignsHandler({ hasMore: true, count: 25 })
    render(<CampaignList />)

    await waitFor(() => {
      expect(screen.getByText("Campanha Teste")).toBeInTheDocument()
    })

    expect(screen.getByText("Anterior")).toBeDisabled()
    expect(screen.getByText("Próximo")).not.toBeDisabled()
  })

  it("renders contacts count", async () => {
    setupCampaignsHandler()
    render(<CampaignList />)

    await waitFor(() => {
      expect(screen.getByText("Campanha Teste")).toBeInTheDocument()
    })

    expect(screen.getByText("2")).toBeInTheDocument()
  })

  it("renders formatted dates", async () => {
    setupCampaignsHandler()
    render(<CampaignList />)

    await waitFor(() => {
      expect(screen.getByText("Campanha Teste")).toBeInTheDocument()
    })

    // Dates are formatted as dd/MM/yyyy - check at least one exists
    const datePattern = /\d{2}\/\d{2}\/2025/
    const allText = document.body.textContent ?? ""
    expect(datePattern.test(allText)).toBe(true)
  })
})

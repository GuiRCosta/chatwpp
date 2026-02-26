import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest"
import { render, screen, waitFor } from "@/__tests__/utils/render"
import TicketList from "@/pages/tickets/TicketList"
import { server } from "@/__tests__/mocks/server"
import { http, HttpResponse } from "msw"
import { useTicketStore } from "@/stores/ticketStore"
import { resetAllStores } from "@/__tests__/utils/storeReset"

vi.mock("@/lib/socket", () => ({
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => null)
}))

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  resetAllStores()
})
afterAll(() => server.close())

describe("TicketList", () => {
  it("renders filter tabs", () => {
    render(<TicketList />)

    expect(screen.getByText("Abertos")).toBeInTheDocument()
    expect(screen.getByText("Pendentes")).toBeInTheDocument()
    expect(screen.getByText("Fechados")).toBeInTheDocument()
    expect(screen.getByText("Todos")).toBeInTheDocument()
  })

  it("renders search input", () => {
    render(<TicketList />)

    expect(
      screen.getByPlaceholderText("Buscar tickets...")
    ).toBeInTheDocument()
  })

  it("shows empty state when no tickets", async () => {
    render(<TicketList />)

    await waitFor(() => {
      expect(
        screen.getByText("Nenhum ticket encontrado")
      ).toBeInTheDocument()
    })
  })

  it("renders ticket list when data exists", async () => {
    server.use(
      http.get("/api/tickets", () => {
        return HttpResponse.json({
          success: true,
          data: {
            tickets: [
              {
                id: 1,
                status: "open",
                lastMessage: "Hello",
                lastMessageAt: new Date().toISOString(),
                contactId: 1,
                contact: {
                  id: 1,
                  name: "John Doe",
                  number: "5511999999999",
                  tenantId: 1,
                  isGroup: false,
                  createdAt: "2024-01-01T00:00:00.000Z",
                  updatedAt: "2024-01-01T00:00:00.000Z"
                },
                tenantId: 1,
                unreadMessages: 2,
                createdAt: "2024-01-01T00:00:00.000Z",
                updatedAt: "2024-01-01T00:00:00.000Z"
              }
            ],
            count: 1,
            hasMore: false
          }
        })
      })
    )

    render(<TicketList />)

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument()
    })
  })

  it("renders the page title", () => {
    render(<TicketList />)

    expect(screen.getByText("Tickets")).toBeInTheDocument()
  })
})

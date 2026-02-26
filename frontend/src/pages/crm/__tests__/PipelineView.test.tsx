import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest"
import { http, HttpResponse } from "msw"
import { render, screen, waitFor, userEvent } from "@/__tests__/utils/render"
import { server } from "@/__tests__/mocks/server"
import { resetAllStores } from "@/__tests__/utils/storeReset"
import { PipelineView } from "../PipelineView"

vi.mock("@/lib/socket", () => ({
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn().mockReturnValue(null)
}))

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }))
afterEach(() => {
  server.resetHandlers()
  resetAllStores()
})
afterAll(() => server.close())

function setupPipelineHandlers() {
  server.use(
    http.get("/api/pipelines", () => {
      return HttpResponse.json({
        success: true,
        data: [
          {
            id: 1,
            name: "Pipeline de Vendas",
            description: "Pipeline principal",
            tenantId: 1,
            createdAt: "2025-01-01T00:00:00.000Z",
            updatedAt: "2025-01-01T00:00:00.000Z"
          }
        ]
      })
    }),
    http.get("/api/contacts", () => {
      return HttpResponse.json({
        success: true,
        data: {
          contacts: [],
          count: 0,
          hasMore: false
        }
      })
    }),
    http.get("/api/kanbans", () => {
      return HttpResponse.json({
        success: true,
        data: [
          {
            id: 1,
            name: "Kanban Principal",
            tenantId: 1,
            createdAt: "2025-01-01T00:00:00.000Z",
            updatedAt: "2025-01-01T00:00:00.000Z"
          }
        ]
      })
    }),
    http.get("/api/kanbans/:id", () => {
      return HttpResponse.json({
        success: true,
        data: {
          id: 1,
          name: "Kanban Principal",
          tenantId: 1,
          stages: [
            {
              id: 1,
              name: "Prospeccao",
              color: "#3B82F6",
              order: 1,
              pipelineId: 1,
              tenantId: 1,
              createdAt: "2025-01-01T00:00:00.000Z",
              updatedAt: "2025-01-01T00:00:00.000Z"
            }
          ],
          createdAt: "2025-01-01T00:00:00.000Z",
          updatedAt: "2025-01-01T00:00:00.000Z"
        }
      })
    }),
    http.get("/api/opportunities", () => {
      return HttpResponse.json({
        success: true,
        data: {
          opportunities: [],
          count: 0,
          hasMore: false
        }
      })
    })
  )
}

function setupEmptyPipelineHandlers() {
  server.use(
    http.get("/api/pipelines", () => {
      return HttpResponse.json({
        success: true,
        data: []
      })
    }),
    http.get("/api/contacts", () => {
      return HttpResponse.json({
        success: true,
        data: {
          contacts: [],
          count: 0,
          hasMore: false
        }
      })
    })
  )
}

describe("PipelineView", () => {
  it("renders the page title", async () => {
    setupEmptyPipelineHandlers()
    render(<PipelineView />)

    expect(screen.getByText("CRM")).toBeInTheDocument()
  })

  it('shows "Nova Oportunidade" button', async () => {
    setupEmptyPipelineHandlers()
    render(<PipelineView />)

    expect(screen.getByText("Nova Oportunidade")).toBeInTheDocument()
  })

  it("shows pipeline selector placeholder", async () => {
    setupEmptyPipelineHandlers()
    render(<PipelineView />)

    expect(
      screen.getByText("Selecione um pipeline")
    ).toBeInTheDocument()
  })

  it("shows empty state message when no pipeline selected", async () => {
    setupEmptyPipelineHandlers()
    render(<PipelineView />)

    await waitFor(() => {
      expect(
        screen.getByText("Selecione um pipeline para visualizar o funil")
      ).toBeInTheDocument()
    })
  })

  it("loads and displays pipeline data", async () => {
    setupPipelineHandlers()
    render(<PipelineView />)

    await waitFor(() => {
      expect(screen.getByText("Prospeccao")).toBeInTheDocument()
    })
  })

  it("shows loading spinner while data is being fetched", async () => {
    server.use(
      http.get("/api/pipelines", () => {
        return HttpResponse.json({
          success: true,
          data: [
            {
              id: 1,
              name: "Pipeline Lento",
              tenantId: 1,
              createdAt: "2025-01-01T00:00:00.000Z",
              updatedAt: "2025-01-01T00:00:00.000Z"
            }
          ]
        })
      }),
      http.get("/api/contacts", () => {
        return HttpResponse.json({
          success: true,
          data: { contacts: [], count: 0, hasMore: false }
        })
      }),
      http.get("/api/kanbans", () => {
        // Delay to keep loading state visible
        return new Promise(() => {
          // Never resolves to keep spinner visible
        })
      })
    )

    const { container } = render(<PipelineView />)

    await waitFor(() => {
      const spinner = container.querySelector(".animate-spin")
      expect(spinner).toBeInTheDocument()
    })
  })

  it("shows Nenhuma oportunidade on empty stage", async () => {
    setupPipelineHandlers()
    render(<PipelineView />)

    await waitFor(() => {
      expect(
        screen.getByText("Nenhuma oportunidade")
      ).toBeInTheDocument()
    })
  })

  it("renders opportunities on the kanban board", async () => {
    server.use(
      http.get("/api/pipelines", () => {
        return HttpResponse.json({
          success: true,
          data: [
            {
              id: 1,
              name: "Pipeline de Vendas",
              tenantId: 1,
              createdAt: "2025-01-01T00:00:00.000Z",
              updatedAt: "2025-01-01T00:00:00.000Z"
            }
          ]
        })
      }),
      http.get("/api/contacts", () => {
        return HttpResponse.json({
          success: true,
          data: { contacts: [], count: 0, hasMore: false }
        })
      }),
      http.get("/api/kanbans", () => {
        return HttpResponse.json({
          success: true,
          data: [
            {
              id: 1,
              name: "Kanban",
              tenantId: 1,
              createdAt: "2025-01-01T00:00:00.000Z",
              updatedAt: "2025-01-01T00:00:00.000Z"
            }
          ]
        })
      }),
      http.get("/api/kanbans/:id", () => {
        return HttpResponse.json({
          success: true,
          data: {
            id: 1,
            name: "Kanban",
            tenantId: 1,
            stages: [
              {
                id: 1,
                name: "Etapa 1",
                color: "#3B82F6",
                order: 1,
                pipelineId: 1,
                tenantId: 1,
                createdAt: "2025-01-01T00:00:00.000Z",
                updatedAt: "2025-01-01T00:00:00.000Z"
              }
            ],
            createdAt: "2025-01-01T00:00:00.000Z",
            updatedAt: "2025-01-01T00:00:00.000Z"
          }
        })
      }),
      http.get("/api/opportunities", () => {
        return HttpResponse.json({
          success: true,
          data: {
            opportunities: [
              {
                id: 1,
                title: "Venda Importante",
                value: 25000,
                contactId: 1,
                contact: {
                  id: 1,
                  name: "Cliente VIP",
                  number: "5511999999999",
                  tenantId: 1,
                  isGroup: false,
                  createdAt: "2025-01-01T00:00:00.000Z",
                  updatedAt: "2025-01-01T00:00:00.000Z"
                },
                stageId: 1,
                tenantId: 1,
                createdAt: "2025-01-01T00:00:00.000Z",
                updatedAt: "2025-01-01T00:00:00.000Z"
              }
            ],
            count: 1,
            hasMore: false
          }
        })
      })
    )

    render(<PipelineView />)

    await waitFor(() => {
      expect(screen.getByText("Cliente VIP")).toBeInTheDocument()
      expect(screen.getByText("Venda Importante")).toBeInTheDocument()
    })
  })

  it("opens create opportunity dialog when button is clicked", async () => {
    setupPipelineHandlers()
    render(<PipelineView />)

    await waitFor(() => {
      expect(screen.getByText("Prospeccao")).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(screen.getByText("Nova Oportunidade"))

    await waitFor(() => {
      expect(
        screen.getByText("Crie uma nova oportunidade no pipeline selecionado")
      ).toBeInTheDocument()
    })
  })
})

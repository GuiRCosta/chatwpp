import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest"
import { http, HttpResponse } from "msw"
import { render, screen, waitFor } from "@/__tests__/utils/render"
import { server } from "@/__tests__/mocks/server"
import { resetAllStores } from "@/__tests__/utils/storeReset"
import { useAuthStore } from "@/stores/authStore"
import { Settings } from "../Settings"

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

function setupSettingsHandlers() {
  server.use(
    http.get("/api/settings", () => {
      return HttpResponse.json({
        data: [
          {
            id: 1,
            key: "companyName",
            value: "ZFlow CRM",
            tenantId: 1,
            createdAt: "2025-01-01T00:00:00.000Z",
            updatedAt: "2025-01-01T00:00:00.000Z"
          }
        ]
      })
    }),
    http.get("/api/queues", () => {
      return HttpResponse.json({
        data: []
      })
    }),
    http.get("/api/whatsapp", () => {
      return HttpResponse.json({
        data: []
      })
    }),
    http.get("/api/users", () => {
      return HttpResponse.json({
        data: []
      })
    })
  )
}

function setAdminUser() {
  useAuthStore.setState({
    user: {
      id: 1,
      name: "Admin User",
      email: "admin@test.com",
      profile: "admin",
      tenantId: 1,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z"
    },
    token: "test-token",
    isAuthenticated: true,
    isLoading: false
  })
}

async function renderAndWaitForLoad() {
  const result = render(<Settings />)
  // Wait for GeneralTab content to appear (means settings fetch completed)
  await waitFor(
    () => {
      expect(screen.getByText("Configuracoes Gerais")).toBeInTheDocument()
    },
    { timeout: 3000 }
  )
  // Small delay to let all remaining fetches (queues, whatsapp, users) settle
  await new Promise((resolve) => setTimeout(resolve, 50))
  return result
}

describe("Settings", () => {
  it("renders the page title", async () => {
    setAdminUser()
    setupSettingsHandlers()
    await renderAndWaitForLoad()

    expect(screen.getByText("Configuracoes")).toBeInTheDocument()
  })

  it("renders the subtitle", async () => {
    setAdminUser()
    setupSettingsHandlers()
    await renderAndWaitForLoad()

    expect(
      screen.getByText("Gerencie as configuracoes do sistema")
    ).toBeInTheDocument()
  })

  it("renders all tab triggers for admin user", async () => {
    setAdminUser()
    setupSettingsHandlers()
    await renderAndWaitForLoad()

    expect(screen.getByText("Geral")).toBeInTheDocument()
    expect(screen.getByText("Filas")).toBeInTheDocument()
    expect(screen.getByText("WhatsApp")).toBeInTheDocument()
    expect(screen.getByText("Usuarios")).toBeInTheDocument()
  })

  it("hides Usuarios tab for non-admin user", async () => {
    useAuthStore.setState({
      user: {
        id: 2,
        name: "Regular User",
        email: "user@test.com",
        profile: "user",
        tenantId: 1,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z"
      },
      token: "test-token",
      isAuthenticated: true,
      isLoading: false
    })
    setupSettingsHandlers()
    await renderAndWaitForLoad()

    expect(screen.getByText("Geral")).toBeInTheDocument()
    expect(screen.getByText("Filas")).toBeInTheDocument()
    expect(screen.getByText("WhatsApp")).toBeInTheDocument()
    expect(screen.queryByText("Usuarios")).not.toBeInTheDocument()
  })

  it("shows default Geral tab content after loading", async () => {
    setAdminUser()
    setupSettingsHandlers()
    await renderAndWaitForLoad()

    expect(screen.getByText("Configuracoes Gerais")).toBeInTheDocument()
  })
})

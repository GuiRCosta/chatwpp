import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest"
import { http, HttpResponse } from "msw"
import { render, screen, waitFor, userEvent } from "@/__tests__/utils/render"
import { ContactList } from "@/pages/contacts/ContactList"
import { server } from "@/__tests__/mocks/server"
import { resetAllStores } from "@/__tests__/utils/storeReset"

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

const mockContacts = [
  {
    id: 1,
    name: "João Silva",
    number: "5511999990001",
    email: "joao@test.com",
    tags: [{ id: 1, name: "VIP", color: "#FF0000", tenantId: 1 }],
    tenantId: 1,
    createdAt: "2025-01-15T12:00:00.000Z",
    updatedAt: "2025-01-15T12:00:00.000Z"
  },
  {
    id: 2,
    name: "Maria Santos",
    number: "5511999990002",
    email: "",
    tags: [],
    tenantId: 1,
    createdAt: "2025-02-10T12:00:00.000Z",
    updatedAt: "2025-02-10T12:00:00.000Z"
  }
]

function setupContactsHandler(opts?: { hasMore?: boolean; count?: number }) {
  const { hasMore = false, count = 2 } = opts ?? {}
  server.use(
    http.get("/api/contacts", () => {
      return HttpResponse.json({
        success: true,
        data: { contacts: mockContacts, count, hasMore }
      })
    })
  )
}

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }))
afterEach(() => {
  server.resetHandlers()
  resetAllStores()
  mockNavigate.mockClear()
})
afterAll(() => server.close())

describe("ContactList", () => {
  it("renders page title", () => {
    render(<ContactList />)

    expect(screen.getByText("Contatos")).toBeInTheDocument()
  })

  it("shows search input", () => {
    render(<ContactList />)

    expect(
      screen.getByPlaceholderText("Buscar contatos...")
    ).toBeInTheDocument()
  })

  it("shows 'Novo Contato' button", () => {
    render(<ContactList />)

    expect(screen.getByText("Novo Contato")).toBeInTheDocument()
  })

  it("navigates to /contacts/new when Novo Contato is clicked", async () => {
    setupContactsHandler()
    render(<ContactList />)

    const user = userEvent.setup()
    await user.click(screen.getByText("Novo Contato"))

    expect(mockNavigate).toHaveBeenCalledWith("/contacts/new")
  })

  it("fetches and displays contacts", async () => {
    setupContactsHandler()
    render(<ContactList />)

    await waitFor(() => {
      expect(screen.getByText("João Silva")).toBeInTheDocument()
    })

    expect(screen.getByText("Maria Santos")).toBeInTheDocument()
    expect(screen.getByText("5511999990001")).toBeInTheDocument()
    expect(screen.getByText("joao@test.com")).toBeInTheDocument()
    expect(screen.getByText("VIP")).toBeInTheDocument()
  })

  it("shows dash for empty email", async () => {
    setupContactsHandler()
    render(<ContactList />)

    await waitFor(() => {
      expect(screen.getByText("Maria Santos")).toBeInTheDocument()
    })

    // Maria has empty email, should show "-"
    const dashes = screen.getAllByText("-")
    expect(dashes.length).toBeGreaterThan(0)
  })

  it("navigates to edit page when row is clicked", async () => {
    setupContactsHandler()
    render(<ContactList />)

    await waitFor(() => {
      expect(screen.getByText("João Silva")).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(screen.getByText("João Silva"))

    expect(mockNavigate).toHaveBeenCalledWith("/contacts/1/edit")
  })

  it("opens delete confirmation dialog", async () => {
    setupContactsHandler()
    render(<ContactList />)

    await waitFor(() => {
      expect(screen.getByText("João Silva")).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const deleteButtons = screen.getAllByRole("button").filter((btn) => {
      const svg = btn.querySelector("svg")
      return svg && btn.closest("tr")
    })
    // Click the first delete button in the table row
    if (deleteButtons.length > 0) {
      await user.click(deleteButtons[0])
    }

    await waitFor(() => {
      expect(screen.getByText("Excluir contato")).toBeInTheDocument()
    })
  })

  it("deletes a contact when confirmed", async () => {
    setupContactsHandler()
    let deleteCalled = false
    server.use(
      http.delete("/api/contacts/1", () => {
        deleteCalled = true
        return HttpResponse.json({ success: true })
      })
    )
    render(<ContactList />)

    await waitFor(() => {
      expect(screen.getByText("João Silva")).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const deleteButtons = screen.getAllByRole("button").filter((btn) => {
      const svg = btn.querySelector("svg")
      return svg && btn.closest("tr")
    })
    if (deleteButtons.length > 0) {
      await user.click(deleteButtons[0])
    }

    await waitFor(() => {
      expect(screen.getByText("Excluir contato")).toBeInTheDocument()
    })

    await user.click(screen.getByText("Excluir"))

    await waitFor(() => {
      expect(deleteCalled).toBe(true)
    })
  })

  it("shows pagination when contacts exist", async () => {
    setupContactsHandler({ hasMore: true, count: 25 })
    render(<ContactList />)

    await waitFor(() => {
      expect(screen.getByText("João Silva")).toBeInTheDocument()
    })

    expect(screen.getByText("Anterior")).toBeInTheDocument()
    expect(screen.getByText("Próximo")).toBeInTheDocument()
  })

  it("disables Anterior button on first page", async () => {
    setupContactsHandler({ hasMore: true, count: 25 })
    render(<ContactList />)

    await waitFor(() => {
      expect(screen.getByText("João Silva")).toBeInTheDocument()
    })

    expect(screen.getByText("Anterior")).toBeDisabled()
  })

  it("enables Próximo button when hasMore is true", async () => {
    setupContactsHandler({ hasMore: true, count: 25 })
    render(<ContactList />)

    await waitFor(() => {
      expect(screen.getByText("João Silva")).toBeInTheDocument()
    })

    expect(screen.getByText("Próximo")).not.toBeDisabled()
  })

  it("triggers search on typing", async () => {
    let lastSearchParam = ""
    server.use(
      http.get("/api/contacts", ({ request }) => {
        const url = new URL(request.url)
        lastSearchParam = url.searchParams.get("searchParam") ?? ""
        return HttpResponse.json({
          success: true,
          data: { contacts: [], count: 0, hasMore: false }
        })
      })
    )
    render(<ContactList />)

    const user = userEvent.setup()
    const searchInput = screen.getByPlaceholderText("Buscar contatos...")
    await user.type(searchInput, "João")

    await waitFor(() => {
      expect(lastSearchParam).toContain("João")
    })
  })
})

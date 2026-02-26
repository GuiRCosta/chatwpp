import { describe, it, expect, vi, beforeAll, beforeEach, afterAll, afterEach } from "vitest"
import { render, screen, waitFor, userEvent } from "@/__tests__/utils/render"
import { http, HttpResponse } from "msw"
import { server } from "@/__tests__/mocks/server"
import { resetAllStores } from "@/__tests__/utils/storeReset"
import { ContactForm } from "../ContactForm"

vi.mock("@/lib/socket", () => ({
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn().mockReturnValue(null)
}))

const mockNavigate = vi.fn()
let mockParamId: string | undefined

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => (mockParamId ? { id: mockParamId } : {})
  }
})

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }))
beforeEach(() => {
  mockNavigate.mockClear()
  mockParamId = undefined
})
afterEach(() => {
  server.resetHandlers()
  resetAllStores()
})
afterAll(() => server.close())

describe("ContactForm", () => {
  it("renders the page title for new contact", () => {
    render(<ContactForm />)

    expect(screen.getByText("Novo Contato")).toBeInTheDocument()
  })

  it("shows name field", () => {
    render(<ContactForm />)

    expect(screen.getByLabelText(/Nome/)).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText("Digite o nome do contato")
    ).toBeInTheDocument()
  })

  it("shows number field", () => {
    render(<ContactForm />)

    expect(screen.getByLabelText(/Número/)).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText("Digite o número do contato")
    ).toBeInTheDocument()
  })

  it("shows email field", () => {
    render(<ContactForm />)

    expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText("Digite o email do contato (opcional)")
    ).toBeInTheDocument()
  })

  it("has save button", () => {
    render(<ContactForm />)

    expect(screen.getByText("Salvar")).toBeInTheDocument()
  })

  it("has cancel button", () => {
    render(<ContactForm />)

    expect(screen.getByText("Cancelar")).toBeInTheDocument()
  })

  it("shows card header with contact info title", () => {
    render(<ContactForm />)

    expect(
      screen.getByText("Informações do Contato")
    ).toBeInTheDocument()
  })

  it("shows validation error when submitting with empty name", async () => {
    render(<ContactForm />)

    const user = userEvent.setup()

    // Fill number but leave name empty
    const numberInput = screen.getByPlaceholderText("Digite o número do contato")
    await user.type(numberInput, "5511999999999")

    await user.click(screen.getByText("Salvar"))

    await waitFor(() => {
      expect(screen.getByText("Nome é obrigatório")).toBeInTheDocument()
    })
  })

  it("shows validation error when submitting with empty number", async () => {
    render(<ContactForm />)

    const user = userEvent.setup()

    // Fill name but leave number empty
    const nameInput = screen.getByPlaceholderText("Digite o nome do contato")
    await user.type(nameInput, "Joao Silva")

    await user.click(screen.getByText("Salvar"))

    await waitFor(() => {
      expect(
        screen.getByText("Número é obrigatório")
      ).toBeInTheDocument()
    })
  })

  it("shows validation error for invalid email", async () => {
    render(<ContactForm />)

    const user = userEvent.setup()

    const nameInput = screen.getByPlaceholderText("Digite o nome do contato")
    await user.type(nameInput, "Joao Silva")

    const numberInput = screen.getByPlaceholderText("Digite o número do contato")
    await user.type(numberInput, "5511999999999")

    const emailInput = screen.getByPlaceholderText(
      "Digite o email do contato (opcional)"
    )
    await user.type(emailInput, "user@domain")

    await user.click(screen.getByText("Salvar"))

    await waitFor(() => {
      expect(screen.getByText("Email inválido")).toBeInTheDocument()
    })
  })

  it("clears validation error when user starts typing", async () => {
    render(<ContactForm />)

    const user = userEvent.setup()

    // Submit empty form to trigger errors
    await user.click(screen.getByText("Salvar"))

    await waitFor(() => {
      expect(screen.getByText("Nome é obrigatório")).toBeInTheDocument()
    })

    // Start typing in name field
    const nameInput = screen.getByPlaceholderText("Digite o nome do contato")
    await user.type(nameInput, "J")

    await waitFor(() => {
      expect(
        screen.queryByText("Nome é obrigatório")
      ).not.toBeInTheDocument()
    })
  })

  it("calls API on successful form submission for new contact", async () => {
    let postCalled = false
    server.use(
      http.post("/api/contacts", () => {
        postCalled = true
        return HttpResponse.json({
          success: true,
          data: {
            id: 1,
            name: "Joao Silva",
            number: "5511999999999",
            tenantId: 1,
            isGroup: false,
            createdAt: "2025-01-01T00:00:00.000Z",
            updatedAt: "2025-01-01T00:00:00.000Z"
          }
        })
      })
    )

    render(<ContactForm />)

    const user = userEvent.setup()

    const nameInput = screen.getByPlaceholderText("Digite o nome do contato")
    await user.type(nameInput, "Joao Silva")

    const numberInput = screen.getByPlaceholderText("Digite o número do contato")
    await user.type(numberInput, "5511999999999")

    await user.click(screen.getByText("Salvar"))

    await waitFor(() => {
      expect(postCalled).toBe(true)
      expect(mockNavigate).toHaveBeenCalledWith("/contacts")
    })
  })

  it("navigates back when cancel is clicked", async () => {
    render(<ContactForm />)

    const user = userEvent.setup()
    await user.click(screen.getByText("Cancelar"))

    expect(mockNavigate).toHaveBeenCalledWith("/contacts")
  })

  it("pre-fills form fields in edit mode", async () => {
    mockParamId = "42"

    server.use(
      http.get("/api/contacts/42", () => {
        return HttpResponse.json({
          success: true,
          data: {
            id: 42,
            name: "Maria Santos",
            number: "5511888888888",
            email: "maria@test.com",
            tenantId: 1,
            isGroup: false,
            createdAt: "2025-01-01T00:00:00.000Z",
            updatedAt: "2025-01-01T00:00:00.000Z"
          }
        })
      })
    )

    render(<ContactForm />)

    await waitFor(() => {
      expect(screen.getByText("Editar Contato")).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByDisplayValue("Maria Santos")).toBeInTheDocument()
      expect(
        screen.getByDisplayValue("5511888888888")
      ).toBeInTheDocument()
      expect(
        screen.getByDisplayValue("maria@test.com")
      ).toBeInTheDocument()
    })
  })

  it("calls PUT API on form submission in edit mode", async () => {
    mockParamId = "42"
    let putCalled = false

    server.use(
      http.get("/api/contacts/42", () => {
        return HttpResponse.json({
          success: true,
          data: {
            id: 42,
            name: "Maria Santos",
            number: "5511888888888",
            email: "maria@test.com",
            tenantId: 1,
            isGroup: false,
            createdAt: "2025-01-01T00:00:00.000Z",
            updatedAt: "2025-01-01T00:00:00.000Z"
          }
        })
      }),
      http.put("/api/contacts/42", () => {
        putCalled = true
        return HttpResponse.json({
          success: true,
          data: {
            id: 42,
            name: "Maria Santos Updated",
            number: "5511888888888",
            tenantId: 1,
            isGroup: false,
            createdAt: "2025-01-01T00:00:00.000Z",
            updatedAt: "2025-01-01T00:00:00.000Z"
          }
        })
      })
    )

    render(<ContactForm />)

    await waitFor(() => {
      expect(screen.getByDisplayValue("Maria Santos")).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(screen.getByText("Salvar"))

    await waitFor(() => {
      expect(putCalled).toBe(true)
      expect(mockNavigate).toHaveBeenCalledWith("/contacts")
    })
  })

  it("shows loading spinner in edit mode while fetching", () => {
    mockParamId = "42"

    server.use(
      http.get("/api/contacts/42", () => {
        // Delay to keep loading state visible
        return new Promise(() => {
          // Never resolves - keeps loading state
        })
      })
    )

    const { container } = render(<ContactForm />)

    const spinner = container.querySelector(".animate-spin")
    expect(spinner).toBeInTheDocument()
  })
})

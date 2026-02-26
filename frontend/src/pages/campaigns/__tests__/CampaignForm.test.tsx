import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest"
import { http, HttpResponse } from "msw"
import { render, screen, waitFor, userEvent } from "@/__tests__/utils/render"
import { server } from "@/__tests__/mocks/server"
import { resetAllStores } from "@/__tests__/utils/storeReset"
import { CampaignForm } from "../CampaignForm"

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

function setupContactsHandler() {
  server.use(
    http.get("/api/contacts", () => {
      return HttpResponse.json({
        success: true,
        data: [
          {
            id: 1,
            name: "Contato Teste",
            number: "5511999999999",
            email: "contato@test.com",
            tenantId: 1,
            isGroup: false,
            createdAt: "2025-01-01T00:00:00.000Z",
            updatedAt: "2025-01-01T00:00:00.000Z"
          },
          {
            id: 2,
            name: "Contato Dois",
            number: "5511999990002",
            email: "dois@test.com",
            tenantId: 1,
            isGroup: false,
            createdAt: "2025-01-01T00:00:00.000Z",
            updatedAt: "2025-01-01T00:00:00.000Z"
          }
        ]
      })
    })
  )
}

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  onSuccess: vi.fn()
}

describe("CampaignForm", () => {
  it("renders dialog when open is true", async () => {
    setupContactsHandler()
    render(<CampaignForm {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText("Nova Campanha")).toBeInTheDocument()
    })
  })

  it("shows name and message fields", async () => {
    setupContactsHandler()
    render(<CampaignForm {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByLabelText(/Nome/)).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/Mensagem/)).toBeInTheDocument()
  })

  it("shows submit button with correct label for new campaign", async () => {
    setupContactsHandler()
    render(<CampaignForm {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText("Criar Campanha")).toBeInTheDocument()
    })
  })

  it("does not render dialog content when open is false", () => {
    render(
      <CampaignForm
        {...defaultProps}
        open={false}
      />
    )

    expect(screen.queryByText("Nova Campanha")).not.toBeInTheDocument()
  })

  it("shows cancel button", async () => {
    setupContactsHandler()
    render(<CampaignForm {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText("Cancelar")).toBeInTheDocument()
    })
  })

  it("shows contact search input", async () => {
    setupContactsHandler()
    render(<CampaignForm {...defaultProps} />)

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Buscar contatos por nome ou numero...")
      ).toBeInTheDocument()
    })
  })

  it("shows 'Editar Campanha' title when editing", async () => {
    setupContactsHandler()
    const campaign = {
      id: 1,
      name: "Campanha Existente",
      message: "Mensagem existente",
      status: "pending" as const,
      whatsappId: 1,
      tenantId: 1,
      contacts: [],
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z"
    }

    render(<CampaignForm {...defaultProps} campaign={campaign} />)

    await waitFor(() => {
      expect(screen.getByText("Editar Campanha")).toBeInTheDocument()
    })
  })

  it("shows validation errors when submitting empty form", async () => {
    setupContactsHandler()
    render(<CampaignForm {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText("Criar Campanha")).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(screen.getByText("Criar Campanha"))

    await waitFor(() => {
      expect(screen.getByText("Nome da campanha e obrigatorio")).toBeInTheDocument()
    })
    expect(screen.getByText("Mensagem e obrigatoria")).toBeInTheDocument()
    expect(screen.getByText("Selecione pelo menos um contato")).toBeInTheDocument()
  })

  it("clears validation error when field is changed", async () => {
    setupContactsHandler()
    render(<CampaignForm {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText("Criar Campanha")).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(screen.getByText("Criar Campanha"))

    await waitFor(() => {
      expect(screen.getByText("Nome da campanha e obrigatorio")).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(/Nome/)
    await user.type(nameInput, "Minha Campanha")

    expect(screen.queryByText("Nome da campanha e obrigatorio")).not.toBeInTheDocument()
  })

  it("loads and displays contacts from API", async () => {
    setupContactsHandler()
    render(<CampaignForm {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText("Contato Teste")).toBeInTheDocument()
    })
    expect(screen.getByText("Contato Dois")).toBeInTheDocument()
  })

  it("toggles contact selection", async () => {
    setupContactsHandler()
    render(<CampaignForm {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText("Contato Teste")).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const checkboxes = screen.getAllByRole("checkbox")
    await user.click(checkboxes[0])

    expect(screen.getByText("1 selecionado(s)")).toBeInTheDocument()

    // Deselect
    await user.click(checkboxes[0])

    expect(screen.getByText("0 selecionado(s)")).toBeInTheDocument()
  })

  it("submits new campaign successfully", async () => {
    setupContactsHandler()
    let postCalled = false
    server.use(
      http.post("/api/campaigns", () => {
        postCalled = true
        return HttpResponse.json({ success: true, data: { id: 1 } })
      })
    )

    const onSuccess = vi.fn()
    const onOpenChange = vi.fn()
    render(
      <CampaignForm
        open={true}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />
    )

    await waitFor(() => {
      expect(screen.getByText("Contato Teste")).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/Nome/), "Campanha Nova")
    await user.type(screen.getByLabelText(/Mensagem/), "Mensagem da campanha")

    const checkboxes = screen.getAllByRole("checkbox")
    await user.click(checkboxes[0])

    await user.click(screen.getByText("Criar Campanha"))

    await waitFor(() => {
      expect(postCalled).toBe(true)
    })
    expect(onSuccess).toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("calls onOpenChange when cancel is clicked", async () => {
    setupContactsHandler()
    const onOpenChange = vi.fn()
    render(
      <CampaignForm
        open={true}
        onOpenChange={onOpenChange}
        onSuccess={vi.fn()}
      />
    )

    await waitFor(() => {
      expect(screen.getByText("Cancelar")).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(screen.getByText("Cancelar"))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("populates form when editing a campaign", async () => {
    setupContactsHandler()
    const campaign = {
      id: 1,
      name: "Campanha Existente",
      message: "Mensagem existente",
      status: "pending" as const,
      scheduledAt: "2025-06-01T10:00:00.000Z",
      whatsappId: 1,
      tenantId: 1,
      contacts: [{ contactId: 1 }],
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z"
    }

    render(<CampaignForm {...defaultProps} campaign={campaign} />)

    await waitFor(() => {
      expect(screen.getByLabelText(/Nome/)).toHaveValue("Campanha Existente")
    })
    expect(screen.getByLabelText(/Mensagem/)).toHaveValue("Mensagem existente")
    expect(screen.getByText("Atualizar")).toBeInTheDocument()
    expect(screen.getByText("Pendente")).toBeInTheDocument()
  })

  it("shows submit error on API failure", async () => {
    setupContactsHandler()
    server.use(
      http.post("/api/campaigns", () => {
        return new HttpResponse(JSON.stringify({ error: "Server error" }), {
          status: 500,
        })
      })
    )

    render(<CampaignForm {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText("Contato Teste")).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/Nome/), "Campanha Falha")
    await user.type(screen.getByLabelText(/Mensagem/), "Teste")

    const checkboxes = screen.getAllByRole("checkbox")
    await user.click(checkboxes[0])

    await user.click(screen.getByText("Criar Campanha"))

    await waitFor(() => {
      // Axios 500 produces an error message, submitError is shown in a red box
      const errorBox = document.querySelector(".text-red-700")
      expect(errorBox).toBeInTheDocument()
    })
  })
})

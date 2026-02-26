import { describe, it, expect, vi } from "vitest"
import { render, screen, userEvent } from "@/__tests__/utils/render"
import { GeneralTab } from "../GeneralTab"
import { QueuesTab } from "../QueuesTab"
import { WhatsAppTab } from "../WhatsAppTab"
import { UsersTab } from "../UsersTab"
import type { GeneralSettings } from "../types"
import type { Queue, WhatsApp, User } from "@/types"

// ─── GeneralTab ──────────────────────────────────────────────────────────────

describe("GeneralTab", () => {
  const defaultSettings: GeneralSettings = {
    companyName: "ZFlow CRM",
    businessHoursOpen: "08:00",
    businessHoursClose: "18:00",
    autoCloseTimeout: "24"
  }

  const defaultProps = {
    settings: defaultSettings,
    isSaving: false,
    onSettingsChange: vi.fn(),
    onSave: vi.fn()
  }

  it("renders the section title", () => {
    render(<GeneralTab {...defaultProps} />)

    expect(screen.getByText("Configuracoes Gerais")).toBeInTheDocument()
  })

  it("renders the company name input with current value", () => {
    render(<GeneralTab {...defaultProps} />)

    const input = screen.getByLabelText("Nome da Empresa")
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue("ZFlow CRM")
  })

  it("renders business hours open input", () => {
    render(<GeneralTab {...defaultProps} />)

    const input = screen.getByLabelText("Horario de Abertura")
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue("08:00")
  })

  it("renders business hours close input", () => {
    render(<GeneralTab {...defaultProps} />)

    const input = screen.getByLabelText("Horario de Fechamento")
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue("18:00")
  })

  it("renders auto close timeout input", () => {
    render(<GeneralTab {...defaultProps} />)

    const input = screen.getByLabelText(
      "Timeout para fechar ticket automaticamente (horas)"
    )
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue(24)
  })

  it("renders the save button", () => {
    render(<GeneralTab {...defaultProps} />)

    expect(screen.getByText("Salvar Configuracoes")).toBeInTheDocument()
  })

  it("calls onSave when save button is clicked", async () => {
    const onSave = vi.fn()
    render(<GeneralTab {...defaultProps} onSave={onSave} />)

    const user = userEvent.setup()
    await user.click(screen.getByText("Salvar Configuracoes"))

    expect(onSave).toHaveBeenCalledOnce()
  })

  it("calls onSettingsChange when company name changes", async () => {
    const onSettingsChange = vi.fn()
    render(
      <GeneralTab {...defaultProps} onSettingsChange={onSettingsChange} />
    )

    const user = userEvent.setup()
    const input = screen.getByLabelText("Nome da Empresa")
    await user.clear(input)
    await user.type(input, "New Company")

    expect(onSettingsChange).toHaveBeenCalledWith("companyName", expect.any(String))
  })

  it("shows saving state on button", () => {
    render(<GeneralTab {...defaultProps} isSaving={true} />)

    expect(screen.getByText("Salvando...")).toBeInTheDocument()
  })

  it("disables save button while saving", () => {
    render(<GeneralTab {...defaultProps} isSaving={true} />)

    const button = screen.getByRole("button", { name: /salvando/i })
    expect(button).toBeDisabled()
  })
})

// ─── QueuesTab ───────────────────────────────────────────────────────────────

describe("QueuesTab", () => {
  const mockQueues: Queue[] = [
    {
      id: 1,
      name: "Suporte",
      color: "#3B82F6",
      tenantId: 1,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z"
    },
    {
      id: 2,
      name: "Vendas",
      color: "#10B981",
      tenantId: 1,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z"
    }
  ]

  const defaultProps = {
    queues: mockQueues,
    isLoading: false,
    onCreateQueue: vi.fn(),
    onDeleteQueue: vi.fn()
  }

  it("renders the section title", () => {
    render(<QueuesTab {...defaultProps} />)

    expect(screen.getByText("Filas de Atendimento")).toBeInTheDocument()
  })

  it("renders queue list when data is provided", () => {
    render(<QueuesTab {...defaultProps} />)

    expect(screen.getByText("Suporte")).toBeInTheDocument()
    expect(screen.getByText("Vendas")).toBeInTheDocument()
  })

  it("shows Nova Fila button", () => {
    render(<QueuesTab {...defaultProps} />)

    expect(screen.getByText("Nova Fila")).toBeInTheDocument()
  })

  it("shows empty state when no queues exist", () => {
    render(<QueuesTab {...defaultProps} queues={[]} />)

    expect(screen.getByText("Nenhuma fila cadastrada")).toBeInTheDocument()
  })

  it("shows loading spinner when loading", () => {
    const { container } = render(
      <QueuesTab {...defaultProps} isLoading={true} queues={[]} />
    )

    const spinner = container.querySelector(".animate-spin")
    expect(spinner).toBeInTheDocument()
  })

  it("opens create dialog when Nova Fila is clicked", async () => {
    render(<QueuesTab {...defaultProps} />)

    const user = userEvent.setup()
    await user.click(screen.getByText("Nova Fila"))

    expect(screen.getByText("Criar Nova Fila")).toBeInTheDocument()
    expect(screen.getByLabelText("Nome da Fila")).toBeInTheDocument()
    expect(screen.getByLabelText("Cor")).toBeInTheDocument()
  })

  it("calls onCreateQueue when form is submitted", async () => {
    const onCreateQueue = vi.fn()
    render(<QueuesTab {...defaultProps} onCreateQueue={onCreateQueue} />)

    const user = userEvent.setup()
    await user.click(screen.getByText("Nova Fila"))

    const nameInput = screen.getByLabelText("Nome da Fila")
    await user.type(nameInput, "Financeiro")
    await user.click(screen.getByText("Criar Fila"))

    expect(onCreateQueue).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Financeiro" })
    )
  })

  it("disables Criar Fila button when name is empty", async () => {
    render(<QueuesTab {...defaultProps} />)

    const user = userEvent.setup()
    await user.click(screen.getByText("Nova Fila"))

    const createButton = screen.getByText("Criar Fila")
    expect(createButton).toBeDisabled()
  })

  it("opens delete confirmation dialog", async () => {
    render(<QueuesTab {...defaultProps} />)

    const user = userEvent.setup()
    const deleteButtons = screen.getAllByRole("button", { name: "" })
    // The delete buttons are icon-only buttons with Trash2 icon
    // Find the first one inside a queue row
    const trashButton = deleteButtons.find((btn) =>
      btn.closest("[class*='rounded-xl']")
    )
    if (trashButton) {
      await user.click(trashButton)

      expect(screen.getByText("Confirmar Exclusao")).toBeInTheDocument()
    }
  })

  it("calls onDeleteQueue when delete is confirmed", async () => {
    const onDeleteQueue = vi.fn()
    render(<QueuesTab {...defaultProps} onDeleteQueue={onDeleteQueue} />)

    const user = userEvent.setup()
    const deleteButtons = screen.getAllByRole("button", { name: "" })
    const trashButton = deleteButtons.find((btn) =>
      btn.closest("[class*='rounded-xl']")
    )
    if (trashButton) {
      await user.click(trashButton)
      await user.click(screen.getByText("Excluir"))

      expect(onDeleteQueue).toHaveBeenCalledWith(1)
    }
  })
})

// ─── WhatsAppTab ─────────────────────────────────────────────────────────────

describe("WhatsAppTab", () => {
  const mockConnections: WhatsApp[] = [
    {
      id: 1,
      name: "WhatsApp Principal",
      number: "5511999999999",
      status: "connected",
      tenantId: 1,
      isDefault: true,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z"
    },
    {
      id: 2,
      name: "WhatsApp Suporte",
      number: "",
      status: "disconnected",
      tenantId: 1,
      isDefault: false,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z"
    }
  ]

  const defaultProps = {
    connections: mockConnections,
    isLoading: false,
    onOnboard: vi.fn()
  }

  it("renders the section title", () => {
    render(<WhatsAppTab {...defaultProps} />)

    expect(screen.getByText("Conexoes WhatsApp")).toBeInTheDocument()
  })

  it("renders connection list", () => {
    render(<WhatsAppTab {...defaultProps} />)

    expect(screen.getByText("WhatsApp Principal")).toBeInTheDocument()
    expect(screen.getByText("WhatsApp Suporte")).toBeInTheDocument()
  })

  it("shows Conectar WhatsApp button", () => {
    render(<WhatsAppTab {...defaultProps} />)

    expect(screen.getByText("Conectar WhatsApp")).toBeInTheDocument()
  })

  it("shows connected status badge", () => {
    render(<WhatsAppTab {...defaultProps} />)

    expect(screen.getByText("Conectado")).toBeInTheDocument()
  })

  it("shows disconnected status badge", () => {
    render(<WhatsAppTab {...defaultProps} />)

    expect(screen.getByText("Desconectado")).toBeInTheDocument()
  })

  it("shows phone number for connected whatsapp", () => {
    render(<WhatsAppTab {...defaultProps} />)

    expect(screen.getByText("5511999999999")).toBeInTheDocument()
  })

  it("shows Sem numero when number is empty", () => {
    render(<WhatsAppTab {...defaultProps} />)

    expect(screen.getByText("Sem numero")).toBeInTheDocument()
  })

  it("shows empty state when no connections exist", () => {
    render(<WhatsAppTab {...defaultProps} connections={[]} />)

    expect(
      screen.getByText("Nenhuma conexao cadastrada")
    ).toBeInTheDocument()
  })

  it("shows loading spinner when loading", () => {
    const { container } = render(
      <WhatsAppTab {...defaultProps} isLoading={true} connections={[]} />
    )

    const spinner = container.querySelector(".animate-spin")
    expect(spinner).toBeInTheDocument()
  })

  it("opens connect dialog when Conectar WhatsApp is clicked", async () => {
    render(<WhatsAppTab {...defaultProps} />)

    const user = userEvent.setup()
    await user.click(screen.getByText("Conectar WhatsApp"))

    expect(
      screen.getByText("Conectar WhatsApp", { selector: "[role='dialog'] *" })
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Nome da Conexao")).toBeInTheDocument()
  })

  it("disables Conectar com Facebook button when name is empty", async () => {
    render(<WhatsAppTab {...defaultProps} />)

    const user = userEvent.setup()
    await user.click(screen.getByText("Conectar WhatsApp"))

    const connectButton = screen.getByText("Conectar com Facebook")
    expect(connectButton).toBeDisabled()
  })
})

// ─── UsersTab ────────────────────────────────────────────────────────────────

describe("UsersTab", () => {
  const mockUsers: User[] = [
    {
      id: 1,
      name: "Admin User",
      email: "admin@test.com",
      profile: "admin",
      tenantId: 1,
      createdAt: "2025-01-15T12:00:00.000Z",
      updatedAt: "2025-01-15T12:00:00.000Z"
    },
    {
      id: 2,
      name: "Regular User",
      email: "user@test.com",
      profile: "user",
      tenantId: 1,
      createdAt: "2025-02-10T12:00:00.000Z",
      updatedAt: "2025-02-10T12:00:00.000Z"
    },
    {
      id: 3,
      name: "Super Admin",
      email: "super@test.com",
      profile: "superadmin",
      tenantId: 1,
      createdAt: "2025-01-01T12:00:00.000Z",
      updatedAt: "2025-01-01T12:00:00.000Z"
    }
  ]

  const defaultProps = {
    users: mockUsers,
    isLoading: false
  }

  it("renders the section title", () => {
    render(<UsersTab {...defaultProps} />)

    expect(screen.getByText("Usuarios")).toBeInTheDocument()
  })

  it("renders user list in a table", () => {
    render(<UsersTab {...defaultProps} />)

    expect(screen.getByText("Admin User")).toBeInTheDocument()
    expect(screen.getByText("Regular User")).toBeInTheDocument()
    expect(screen.getByText("Super Admin")).toBeInTheDocument()
  })

  it("renders user emails", () => {
    render(<UsersTab {...defaultProps} />)

    expect(screen.getByText("admin@test.com")).toBeInTheDocument()
    expect(screen.getByText("user@test.com")).toBeInTheDocument()
    expect(screen.getByText("super@test.com")).toBeInTheDocument()
  })

  it("renders role badges", () => {
    render(<UsersTab {...defaultProps} />)

    expect(screen.getByText("admin")).toBeInTheDocument()
    expect(screen.getByText("user")).toBeInTheDocument()
    expect(screen.getByText("superadmin")).toBeInTheDocument()
  })

  it("shows search input", () => {
    render(<UsersTab {...defaultProps} />)

    expect(
      screen.getByPlaceholderText("Buscar por nome ou email...")
    ).toBeInTheDocument()
  })

  it("filters users by name", async () => {
    render(<UsersTab {...defaultProps} />)

    const user = userEvent.setup()
    const searchInput = screen.getByPlaceholderText(
      "Buscar por nome ou email..."
    )
    await user.type(searchInput, "Admin User")

    expect(screen.getByText("Admin User")).toBeInTheDocument()
    expect(screen.queryByText("Regular User")).not.toBeInTheDocument()
  })

  it("filters users by email", async () => {
    render(<UsersTab {...defaultProps} />)

    const user = userEvent.setup()
    const searchInput = screen.getByPlaceholderText(
      "Buscar por nome ou email..."
    )
    await user.type(searchInput, "user@test.com")

    expect(screen.getByText("Regular User")).toBeInTheDocument()
    expect(screen.queryByText("Admin User")).not.toBeInTheDocument()
  })

  it("shows empty state when no users match search", async () => {
    render(<UsersTab {...defaultProps} />)

    const user = userEvent.setup()
    const searchInput = screen.getByPlaceholderText(
      "Buscar por nome ou email..."
    )
    await user.type(searchInput, "nonexistent")

    expect(
      screen.getByText("Nenhum usuario encontrado")
    ).toBeInTheDocument()
  })

  it("shows empty state when no users exist", () => {
    render(<UsersTab {...defaultProps} users={[]} />)

    expect(
      screen.getByText("Nenhum usuario cadastrado")
    ).toBeInTheDocument()
  })

  it("shows loading spinner when loading", () => {
    const { container } = render(
      <UsersTab {...defaultProps} isLoading={true} users={[]} />
    )

    const spinner = container.querySelector(".animate-spin")
    expect(spinner).toBeInTheDocument()
  })

  it("renders table headers", () => {
    render(<UsersTab {...defaultProps} />)

    expect(screen.getByText("Nome")).toBeInTheDocument()
    expect(screen.getByText("Email")).toBeInTheDocument()
    expect(screen.getByText("Perfil")).toBeInTheDocument()
    expect(screen.getByText("Criado em")).toBeInTheDocument()
  })

  it("renders formatted creation dates", () => {
    render(<UsersTab {...defaultProps} />)

    // pt-BR date format: dd/mm/yyyy
    expect(screen.getByText("15/01/2025")).toBeInTheDocument()
    expect(screen.getByText("10/02/2025")).toBeInTheDocument()
  })
})

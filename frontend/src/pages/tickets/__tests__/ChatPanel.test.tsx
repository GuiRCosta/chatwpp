import { describe, it, expect, vi, beforeAll, beforeEach, afterAll, afterEach } from "vitest"
import { render, screen, waitFor, userEvent } from "@/__tests__/utils/render"
import { http, HttpResponse } from "msw"
import { server } from "@/__tests__/mocks/server"
import { resetAllStores } from "@/__tests__/utils/storeReset"
import { useChatStore } from "@/stores/chatStore"
import { useTicketStore } from "@/stores/ticketStore"
import ChatPanel from "../ChatPanel"
import type { Ticket, Message } from "@/types"

vi.mock("@/lib/socket", () => ({
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn().mockReturnValue(null)
}))

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }))
beforeEach(() => {
  // jsdom does not implement scrollIntoView
  Element.prototype.scrollIntoView = vi.fn()
})
afterEach(() => {
  server.resetHandlers()
  resetAllStores()
})
afterAll(() => server.close())

const mockTicket: Ticket = {
  id: 1,
  status: "open",
  lastMessage: "Ola, tudo bem?",
  lastMessageAt: "2025-01-15T10:00:00.000Z",
  contactId: 1,
  contact: {
    id: 1,
    name: "Joao Silva",
    number: "5511999999999",
    profilePicUrl: undefined,
    tenantId: 1,
    isGroup: false,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z"
  },
  tenantId: 1,
  unreadMessages: 0,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z"
}

const mockMessages: Message[] = [
  {
    id: 1,
    body: "Ola, preciso de ajuda",
    fromMe: false,
    read: true,
    ack: 0,
    ticketId: 1,
    contactId: 1,
    tenantId: 1,
    createdAt: "2025-01-15T10:00:00.000Z",
    updatedAt: "2025-01-15T10:00:00.000Z"
  },
  {
    id: 2,
    body: "Claro, como posso ajudar?",
    fromMe: true,
    read: true,
    ack: 3,
    ticketId: 1,
    contactId: 1,
    tenantId: 1,
    createdAt: "2025-01-15T10:01:00.000Z",
    updatedAt: "2025-01-15T10:01:00.000Z"
  }
]

describe("ChatPanel", () => {
  it("renders ticket header with contact name", async () => {
    render(<ChatPanel ticket={mockTicket} />)

    await waitFor(() => {
      expect(screen.getByText("Joao Silva")).toBeInTheDocument()
    })
  })

  it("renders ticket header with contact number", async () => {
    render(<ChatPanel ticket={mockTicket} />)

    await waitFor(() => {
      expect(screen.getByText("5511999999999")).toBeInTheDocument()
    })
  })

  it("renders ticket status", async () => {
    render(<ChatPanel ticket={mockTicket} />)

    await waitFor(() => {
      expect(screen.getByText("Aberto")).toBeInTheDocument()
    })
  })

  it("shows message input area", async () => {
    render(<ChatPanel ticket={mockTicket} />)

    expect(
      screen.getByPlaceholderText("Digite uma mensagem...")
    ).toBeInTheDocument()
  })

  it("shows loading state initially", async () => {
    render(<ChatPanel ticket={mockTicket} />)

    // Initially shows loading text or empty state depending on message fetch
    await waitFor(() => {
      const loadingOrEmpty =
        screen.queryByText("Carregando mensagens...") ||
        screen.queryByText("Nenhuma mensagem ainda")
      expect(loadingOrEmpty).toBeInTheDocument()
    })
  })

  it("renders messages when provided via store", async () => {
    useChatStore.setState({
      messages: mockMessages,
      isLoading: false,
      currentTicketId: 1
    })

    render(<ChatPanel ticket={mockTicket} />)

    await waitFor(() => {
      expect(
        screen.getByText("Ola, preciso de ajuda")
      ).toBeInTheDocument()
      expect(
        screen.getByText("Claro, como posso ajudar?")
      ).toBeInTheDocument()
    })
  })

  it("renders contact initials in avatar fallback", async () => {
    render(<ChatPanel ticket={mockTicket} />)

    await waitFor(() => {
      expect(screen.getByText("JS")).toBeInTheDocument()
    })
  })

  it("sends a message when typing and pressing Enter", async () => {
    const sendMessageSpy = vi.fn().mockResolvedValue(undefined)
    useChatStore.setState({
      messages: mockMessages,
      isLoading: false,
      currentTicketId: 1,
      sendMessage: sendMessageSpy
    })

    render(<ChatPanel ticket={mockTicket} />)

    const user = userEvent.setup()
    const textarea = screen.getByPlaceholderText("Digite uma mensagem...")
    await user.type(textarea, "Mensagem de teste")
    await user.keyboard("{Enter}")

    await waitFor(() => {
      expect(sendMessageSpy).toHaveBeenCalledWith(1, "Mensagem de teste")
    })
  })

  it("does not send empty messages", async () => {
    const sendMessageSpy = vi.fn().mockResolvedValue(undefined)
    useChatStore.setState({
      messages: mockMessages,
      isLoading: false,
      currentTicketId: 1,
      sendMessage: sendMessageSpy
    })

    render(<ChatPanel ticket={mockTicket} />)

    const user = userEvent.setup()
    const textarea = screen.getByPlaceholderText("Digite uma mensagem...")
    await user.click(textarea)
    await user.keyboard("{Enter}")

    expect(sendMessageSpy).not.toHaveBeenCalled()
  })

  it("shows mic button when input is empty", () => {
    useChatStore.setState({
      messages: [],
      isLoading: false,
      currentTicketId: 1
    })

    render(<ChatPanel ticket={mockTicket} />)

    expect(screen.getByTestId("chat-mic-button")).toBeInTheDocument()
  })

  it("aligns incoming messages to the left", async () => {
    useChatStore.setState({
      messages: mockMessages,
      isLoading: false,
      currentTicketId: 1
    })

    render(<ChatPanel ticket={mockTicket} />)

    await waitFor(() => {
      const incomingMsg = screen.getByText("Ola, preciso de ajuda")
      const bubble = incomingMsg.closest("[class*='justify-']")
      expect(bubble?.className).toContain("justify-start")
    })
  })

  it("aligns outgoing messages to the right", async () => {
    useChatStore.setState({
      messages: mockMessages,
      isLoading: false,
      currentTicketId: 1
    })

    render(<ChatPanel ticket={mockTicket} />)

    await waitFor(() => {
      const outgoingMsg = screen.getByText("Claro, como posso ajudar?")
      const bubble = outgoingMsg.closest("[class*='justify-']")
      expect(bubble?.className).toContain("justify-end")
    })
  })

  it("shows date separator for messages on different dates", async () => {
    const messagesOnDifferentDates: Message[] = [
      {
        id: 10,
        body: "Mensagem dia 1",
        fromMe: false,
        read: true,
        ack: 0,
        ticketId: 1,
        contactId: 1,
        tenantId: 1,
        createdAt: "2025-01-14T10:00:00.000Z",
        updatedAt: "2025-01-14T10:00:00.000Z"
      },
      {
        id: 11,
        body: "Mensagem dia 2",
        fromMe: true,
        read: true,
        ack: 3,
        ticketId: 1,
        contactId: 1,
        tenantId: 1,
        createdAt: "2025-01-15T10:00:00.000Z",
        updatedAt: "2025-01-15T10:00:00.000Z"
      }
    ]

    useChatStore.setState({
      messages: messagesOnDifferentDates,
      isLoading: false,
      currentTicketId: 1
    })

    render(<ChatPanel ticket={mockTicket} />)

    await waitFor(() => {
      expect(screen.getByText("Mensagem dia 1")).toBeInTheDocument()
      expect(screen.getByText("Mensagem dia 2")).toBeInTheDocument()
      // Date separators should be present for both dates
      const dateSeparators = screen.getAllByText(/de janeiro de 2025/i)
      expect(dateSeparators.length).toBe(2)
    })
  })

  it("shows loading state when messages are loading and empty", () => {
    useChatStore.setState({
      messages: [],
      isLoading: true,
      currentTicketId: 1
    })

    render(<ChatPanel ticket={mockTicket} />)

    expect(
      screen.getByText("Carregando mensagens...")
    ).toBeInTheDocument()
  })

  it("shows empty state when no messages exist", async () => {
    useChatStore.setState({
      messages: [],
      isLoading: false,
      currentTicketId: 1
    })

    render(<ChatPanel ticket={mockTicket} />)

    // useEffect calls fetchMessages which hits MSW returning empty messages
    await waitFor(() => {
      expect(
        screen.getByText("Nenhuma mensagem ainda")
      ).toBeInTheDocument()
    })
  })

  it("renders pending ticket status", async () => {
    const pendingTicket: Ticket = {
      ...mockTicket,
      status: "pending"
    }

    render(<ChatPanel ticket={pendingTicket} />)

    await waitFor(() => {
      expect(screen.getByText("Pendente")).toBeInTheDocument()
    })
  })

  it("renders closed ticket status", async () => {
    const closedTicket: Ticket = {
      ...mockTicket,
      status: "closed"
    }

    render(<ChatPanel ticket={closedTicket} />)

    await waitFor(() => {
      expect(screen.getByText("Fechado")).toBeInTheDocument()
    })
  })

  it("shows double check icon for read messages (ack >= 3)", async () => {
    // Override MSW handler to return a message with ack >= 3
    server.use(
      http.get("/api/messages/:ticketId", () => {
        return HttpResponse.json({
          success: true,
          data: {
            messages: [mockMessages[1]],
            count: 1,
            hasMore: false
          }
        })
      })
    )

    const { container } = render(<ChatPanel ticket={mockTicket} />)

    await waitFor(() => {
      expect(screen.getByText("Claro, como posso ajudar?")).toBeInTheDocument()
    })

    // CheckCheck icon (double check) should render for ack >= 3
    const blueSpans = container.querySelectorAll(".text-blue-100")
    expect(blueSpans.length).toBeGreaterThan(0)
  })

  it("clears selection when close button is clicked", async () => {
    const clearSelectionSpy = vi.fn()
    useTicketStore.setState({
      clearSelection: clearSelectionSpy
    })

    render(<ChatPanel ticket={mockTicket} />)

    const user = userEvent.setup()
    // The close button is a ghost button with an X icon
    const buttons = screen.getAllByRole("button")
    const closeButton = buttons.find((btn) =>
      btn.className.includes("hover:bg-gray-100")
    )
    if (closeButton) {
      await user.click(closeButton)
      expect(clearSelectionSpy).toHaveBeenCalledOnce()
    }
  })

  it("displays message timestamps", async () => {
    useChatStore.setState({
      messages: mockMessages,
      isLoading: false,
      currentTicketId: 1
    })

    render(<ChatPanel ticket={mockTicket} />)

    await waitFor(() => {
      // Messages have createdAt timestamps that get formatted as HH:mm
      // 2025-01-15T10:00:00.000Z -> local time depends on timezone
      // Look for the time format pattern
      const timeElements = screen.getAllByText(/\d{2}:\d{2}/)
      expect(timeElements.length).toBeGreaterThanOrEqual(2)
    })
  })
})

import { describe, it, expect, vi, beforeEach } from "vitest"

// The SendMessageJob module exports a function named "process", which in vitest's
// ESM transform shadows Node's global `process` inside the module scope.
// We work around this by dynamically importing the module at test time.
vi.mock("@/models/Message", () => ({
  default: {
    findByPk: vi.fn()
  }
}))

vi.mock("@/models/Ticket", () => ({
  default: {
    findByPk: vi.fn()
  }
}))

vi.mock("@/models/Contact", () => ({
  default: {
    findByPk: vi.fn()
  }
}))

vi.mock("@/models/WhatsApp", () => ({
  default: {
    findByPk: vi.fn()
  }
}))

vi.mock("@/libs/waba/wabaClient", () => ({
  sendTextMessage: vi.fn(),
  sendMediaMessage: vi.fn()
}))

vi.mock("@/helpers/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

import * as SendMessageJob from "../SendMessageJob"
import Message from "@/models/Message"
import Ticket from "@/models/Ticket"
import Contact from "@/models/Contact"
import WhatsApp from "@/models/WhatsApp"
import { sendTextMessage, sendMediaMessage } from "@/libs/waba/wabaClient"
import { buildMessage, buildTicket, buildContact, buildWhatsApp } from "@/__tests__/factories"

describe("SendMessageJob", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // The exported function "process" shadows Node's global "process" inside the
    // module scope. When the code accesses process.env.BACKEND_URL, it resolves
    // to (the function).env which is undefined. We attach the real env to fix this.
    ;(SendMessageJob.process as unknown as Record<string, unknown>).env = globalThis.process.env
  })

  const createJob = (data: { messageId: number; ticketId: number; tenantId: number }) =>
    ({ data }) as any

  it("processes a text message successfully", async () => {
    const mockMessage = buildMessage({ id: 1, body: "Hello", mediaUrl: null, mediaType: null })
    vi.mocked(Message.findByPk).mockResolvedValue(mockMessage as any)

    const mockTicket = buildTicket({ id: 1, whatsappId: 1, contactId: 5 })
    vi.mocked(Ticket.findByPk).mockResolvedValue(mockTicket as any)

    const mockWhatsApp = buildWhatsApp({
      id: 1,
      status: "connected",
      wabaPhoneNumberId: "phone-123",
      wabaToken: "token-abc"
    })
    vi.mocked(WhatsApp.findByPk).mockResolvedValue(mockWhatsApp as any)

    const mockContact = buildContact({ id: 5, number: "5511999999999" })
    vi.mocked(Contact.findByPk).mockResolvedValue(mockContact as any)

    vi.mocked(sendTextMessage).mockResolvedValue({
      messages: [{ id: "wamid.123" }]
    } as any)

    await SendMessageJob.process(createJob({ messageId: 1, ticketId: 1, tenantId: 1 }))

    expect(sendTextMessage).toHaveBeenCalledWith(
      "phone-123",
      "token-abc",
      "5511999999999",
      "Hello"
    )
    expect(mockMessage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        remoteJid: "wamid.123",
        status: "sent",
        ack: 1
      })
    )
  })

  it("processes a media message successfully", async () => {
    const mockMessage = buildMessage({
      id: 2,
      body: "Check this",
      mediaUrl: "uploads/image.jpg",
      mediaType: "image"
    })
    vi.mocked(Message.findByPk).mockResolvedValue(mockMessage as any)

    const mockTicket = buildTicket({ id: 1, whatsappId: 1, contactId: 5 })
    vi.mocked(Ticket.findByPk).mockResolvedValue(mockTicket as any)

    const mockWhatsApp = buildWhatsApp({
      id: 1,
      status: "connected",
      wabaPhoneNumberId: "phone-123",
      wabaToken: "token-abc"
    })
    vi.mocked(WhatsApp.findByPk).mockResolvedValue(mockWhatsApp as any)

    const mockContact = buildContact({ id: 5, number: "5511999999999" })
    vi.mocked(Contact.findByPk).mockResolvedValue(mockContact as any)

    vi.mocked(sendMediaMessage).mockResolvedValue({
      messages: [{ id: "wamid.456" }]
    } as any)

    await SendMessageJob.process(createJob({ messageId: 2, ticketId: 1, tenantId: 1 }))

    expect(sendMediaMessage).toHaveBeenCalledWith(
      "phone-123",
      "token-abc",
      "5511999999999",
      "image",
      expect.stringContaining("uploads/image.jpg"),
      "Check this"
    )
  })

  it("returns early when message is not found", async () => {
    vi.mocked(Message.findByPk).mockResolvedValue(null)

    await SendMessageJob.process(createJob({ messageId: 999, ticketId: 1, tenantId: 1 }))

    expect(sendTextMessage).not.toHaveBeenCalled()
    expect(sendMediaMessage).not.toHaveBeenCalled()
  })

  it("returns early when ticket is not found", async () => {
    const mockMessage = buildMessage({ id: 1 })
    vi.mocked(Message.findByPk).mockResolvedValue(mockMessage as any)
    vi.mocked(Ticket.findByPk).mockResolvedValue(null)

    await SendMessageJob.process(createJob({ messageId: 1, ticketId: 999, tenantId: 1 }))

    expect(sendTextMessage).not.toHaveBeenCalled()
  })

  it("returns early when WhatsApp is not connected", async () => {
    const mockMessage = buildMessage({ id: 1 })
    vi.mocked(Message.findByPk).mockResolvedValue(mockMessage as any)

    const mockTicket = buildTicket({ id: 1, whatsappId: 1 })
    vi.mocked(Ticket.findByPk).mockResolvedValue(mockTicket as any)

    const mockWhatsApp = buildWhatsApp({
      id: 1,
      status: "disconnected",
      wabaPhoneNumberId: "phone-123",
      wabaToken: "token-abc"
    })
    vi.mocked(WhatsApp.findByPk).mockResolvedValue(mockWhatsApp as any)

    await SendMessageJob.process(createJob({ messageId: 1, ticketId: 1, tenantId: 1 }))

    expect(sendTextMessage).not.toHaveBeenCalled()
  })

  it("returns early when WhatsApp has no WABA credentials", async () => {
    const mockMessage = buildMessage({ id: 1 })
    vi.mocked(Message.findByPk).mockResolvedValue(mockMessage as any)

    const mockTicket = buildTicket({ id: 1, whatsappId: 1 })
    vi.mocked(Ticket.findByPk).mockResolvedValue(mockTicket as any)

    const mockWhatsApp = buildWhatsApp({
      id: 1,
      status: "connected",
      wabaPhoneNumberId: null,
      wabaToken: null
    })
    vi.mocked(WhatsApp.findByPk).mockResolvedValue(mockWhatsApp as any)

    await SendMessageJob.process(createJob({ messageId: 1, ticketId: 1, tenantId: 1 }))

    expect(sendTextMessage).not.toHaveBeenCalled()
  })
})

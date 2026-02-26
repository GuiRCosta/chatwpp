import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/models/WhatsApp", () => ({
  default: { findOne: vi.fn() }
}))

vi.mock("@/models/Contact", () => ({
  default: { findOne: vi.fn(), create: vi.fn() }
}))

vi.mock("@/models/Ticket", () => ({
  default: {
    findOne: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn()
  }
}))

vi.mock("@/models/Message", () => ({
  default: {
    findOne: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn()
  }
}))

vi.mock("@/models/TicketLog", () => ({
  default: { create: vi.fn() }
}))

vi.mock("@/libs/socket", () => ({
  emitToTenant: vi.fn(),
  emitToTicket: vi.fn()
}))

vi.mock("../mediaHandler", () => ({
  downloadAndSaveMedia: vi.fn()
}))

vi.mock("@/helpers/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

import { verifyWebhook, processWebhook } from "../webhookHandler"
import WhatsApp from "@/models/WhatsApp"
import Contact from "@/models/Contact"
import Ticket from "@/models/Ticket"
import Message from "@/models/Message"
import TicketLog from "@/models/TicketLog"
import { emitToTenant, emitToTicket } from "@/libs/socket"
import { downloadAndSaveMedia } from "../mediaHandler"
import { buildContact, buildTicket, buildMessage } from "@/__tests__/factories"
import type { WabaWebhookBody } from "../types"

describe("webhookHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("verifyWebhook", () => {
    const originalEnv = { ...process.env }

    beforeEach(() => {
      process.env.META_VERIFY_TOKEN = "my-verify-token"
    })

    afterEach(() => {
      process.env = { ...originalEnv }
    })

    it("returns challenge when mode and token are valid", () => {
      const result = verifyWebhook("subscribe", "my-verify-token", "challenge-123")

      expect(result).toBe("challenge-123")
    })

    it("returns null when mode is not subscribe", () => {
      const result = verifyWebhook("unsubscribe", "my-verify-token", "challenge-123")

      expect(result).toBeNull()
    })

    it("returns null when token does not match", () => {
      const result = verifyWebhook("subscribe", "wrong-token", "challenge-123")

      expect(result).toBeNull()
    })

    it("returns null when mode is undefined", () => {
      const result = verifyWebhook(undefined, "my-verify-token", "challenge-123")

      expect(result).toBeNull()
    })

    it("returns null when challenge is undefined", () => {
      const result = verifyWebhook("subscribe", "my-verify-token", undefined)

      expect(result).toBeNull()
    })
  })

  describe("processWebhook", () => {
    function buildWebhookBody(
      overrides: {
        messages?: any[]
        contacts?: any[]
        statuses?: any[]
        field?: string
        object?: string
      } = {}
    ): WabaWebhookBody {
      return {
        object: (overrides.object || "whatsapp_business_account") as "whatsapp_business_account",
        entry: [
          {
            id: "entry-1",
            changes: [
              {
                field: (overrides.field || "messages") as "messages",
                value: {
                  messaging_product: "whatsapp",
                  metadata: {
                    display_phone_number: "+5511999999999",
                    phone_number_id: "phone-123"
                  },
                  contacts: overrides.contacts,
                  messages: overrides.messages,
                  statuses: overrides.statuses
                }
              }
            ]
          }
        ]
      }
    }

    it("ignores non-whatsapp_business_account objects", async () => {
      const body = buildWebhookBody({ object: "other_object" })

      await processWebhook(body)

      expect(WhatsApp.findOne).not.toHaveBeenCalled()
    })

    it("ignores changes with non-messages field", async () => {
      const body = buildWebhookBody({ field: "account_update" })

      await processWebhook(body)

      expect(WhatsApp.findOne).not.toHaveBeenCalled()
    })

    it("processes an incoming text message", async () => {
      const mockWhatsApp = {
        id: 1,
        tenantId: 1,
        wabaPhoneNumberId: "phone-123",
        wabaToken: "token-abc"
      }
      vi.mocked(WhatsApp.findOne).mockResolvedValue(mockWhatsApp as any)

      const mockContact = buildContact({ id: 5, number: "5511888888888", name: "John" })
      vi.mocked(Contact.findOne).mockResolvedValue(mockContact as any)

      const mockTicket = buildTicket({
        id: 10,
        tenantId: 1,
        status: "open",
        unreadMessages: 0
      })
      vi.mocked(Ticket.findOne).mockResolvedValue(mockTicket as any)
      vi.mocked(Ticket.findByPk).mockResolvedValue(mockTicket as any)

      vi.mocked(Message.findOne).mockResolvedValue(null)

      const mockMessage = buildMessage({ id: 20 })
      vi.mocked(Message.create).mockResolvedValue(mockMessage as any)
      vi.mocked(Message.findByPk).mockResolvedValue(mockMessage as any)

      const body = buildWebhookBody({
        contacts: [{ profile: { name: "John" }, wa_id: "5511888888888" }],
        messages: [
          {
            id: "wamid.incoming1",
            from: "5511888888888",
            timestamp: "1700000000",
            type: "text",
            text: { body: "Hello from WhatsApp" }
          }
        ]
      })

      await processWebhook(body)

      expect(WhatsApp.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { wabaPhoneNumberId: "phone-123" }
        })
      )
      expect(Message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          body: "Hello from WhatsApp",
          fromMe: false,
          remoteJid: "wamid.incoming1"
        })
      )
      expect(emitToTicket).toHaveBeenCalled()
      expect(emitToTenant).toHaveBeenCalled()
    })

    it("skips duplicate messages", async () => {
      const mockWhatsApp = {
        id: 1,
        tenantId: 1,
        wabaPhoneNumberId: "phone-123",
        wabaToken: "token-abc"
      }
      vi.mocked(WhatsApp.findOne).mockResolvedValue(mockWhatsApp as any)

      const mockContact = buildContact({ id: 5 })
      vi.mocked(Contact.findOne).mockResolvedValue(mockContact as any)

      const mockTicket = buildTicket({ id: 10 })
      vi.mocked(Ticket.findOne).mockResolvedValue(mockTicket as any)

      const existingMessage = buildMessage({ id: 20, remoteJid: "wamid.duplicate" })
      vi.mocked(Message.findOne).mockResolvedValue(existingMessage as any)

      const body = buildWebhookBody({
        contacts: [{ profile: { name: "John" }, wa_id: "5511888888888" }],
        messages: [
          {
            id: "wamid.duplicate",
            from: "5511888888888",
            timestamp: "1700000000",
            type: "text",
            text: { body: "Duplicate" }
          }
        ]
      })

      await processWebhook(body)

      expect(Message.create).not.toHaveBeenCalled()
    })

    it("warns when no WhatsApp connection found", async () => {
      vi.mocked(WhatsApp.findOne).mockResolvedValue(null)

      const body = buildWebhookBody({
        contacts: [{ profile: { name: "John" }, wa_id: "5511888888888" }],
        messages: [
          {
            id: "wamid.1",
            from: "5511888888888",
            timestamp: "1700000000",
            type: "text",
            text: { body: "Hello" }
          }
        ]
      })

      await processWebhook(body)

      expect(Message.create).not.toHaveBeenCalled()
    })

    it("creates a new contact if not found", async () => {
      const mockWhatsApp = {
        id: 1,
        tenantId: 1,
        wabaPhoneNumberId: "phone-123",
        wabaToken: "token-abc"
      }
      vi.mocked(WhatsApp.findOne).mockResolvedValue(mockWhatsApp as any)

      vi.mocked(Contact.findOne).mockResolvedValue(null)
      const newContact = buildContact({ id: 7, number: "5511777777777", name: "New User" })
      vi.mocked(Contact.create).mockResolvedValue(newContact as any)

      const mockTicket = buildTicket({ id: 10, status: "open", unreadMessages: 0 })
      vi.mocked(Ticket.findOne).mockResolvedValue(mockTicket as any)
      vi.mocked(Ticket.findByPk).mockResolvedValue(mockTicket as any)

      vi.mocked(Message.findOne).mockResolvedValue(null)
      const mockMessage = buildMessage({ id: 20 })
      vi.mocked(Message.create).mockResolvedValue(mockMessage as any)
      vi.mocked(Message.findByPk).mockResolvedValue(mockMessage as any)

      const body = buildWebhookBody({
        contacts: [{ profile: { name: "New User" }, wa_id: "5511777777777" }],
        messages: [
          {
            id: "wamid.new1",
            from: "5511777777777",
            timestamp: "1700000000",
            type: "text",
            text: { body: "Hi" }
          }
        ]
      })

      await processWebhook(body)

      expect(Contact.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          name: "New User",
          number: "5511777777777"
        })
      )
    })

    it("creates a new ticket if none open", async () => {
      const mockWhatsApp = {
        id: 1,
        tenantId: 1,
        wabaPhoneNumberId: "phone-123",
        wabaToken: "token-abc"
      }
      vi.mocked(WhatsApp.findOne).mockResolvedValue(mockWhatsApp as any)

      const mockContact = buildContact({ id: 5 })
      vi.mocked(Contact.findOne).mockResolvedValue(mockContact as any)

      vi.mocked(Ticket.findOne).mockResolvedValue(null)
      const newTicket = buildTicket({ id: 15, status: "pending", unreadMessages: 0 })
      vi.mocked(Ticket.create).mockResolvedValue(newTicket as any)
      vi.mocked(Ticket.findByPk).mockResolvedValue(newTicket as any)
      vi.mocked(TicketLog.create).mockResolvedValue({} as any)

      vi.mocked(Message.findOne).mockResolvedValue(null)
      const mockMessage = buildMessage({ id: 20 })
      vi.mocked(Message.create).mockResolvedValue(mockMessage as any)
      vi.mocked(Message.findByPk).mockResolvedValue(mockMessage as any)

      const body = buildWebhookBody({
        contacts: [{ profile: { name: "John" }, wa_id: "5511888888888" }],
        messages: [
          {
            id: "wamid.ticket1",
            from: "5511888888888",
            timestamp: "1700000000",
            type: "text",
            text: { body: "New conversation" }
          }
        ]
      })

      await processWebhook(body)

      expect(Ticket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          status: "pending",
          channel: "whatsapp"
        })
      )
      expect(TicketLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ticketId: 15,
          type: "created"
        })
      )
    })

    it("processes a media message", async () => {
      const mockWhatsApp = {
        id: 1,
        tenantId: 1,
        wabaPhoneNumberId: "phone-123",
        wabaToken: "token-abc"
      }
      vi.mocked(WhatsApp.findOne).mockResolvedValue(mockWhatsApp as any)

      const mockContact = buildContact({ id: 5 })
      vi.mocked(Contact.findOne).mockResolvedValue(mockContact as any)

      const mockTicket = buildTicket({ id: 10, status: "open", unreadMessages: 0 })
      vi.mocked(Ticket.findOne).mockResolvedValue(mockTicket as any)
      vi.mocked(Ticket.findByPk).mockResolvedValue(mockTicket as any)

      vi.mocked(Message.findOne).mockResolvedValue(null)
      const mockMessage = buildMessage({ id: 20 })
      vi.mocked(Message.create).mockResolvedValue(mockMessage as any)
      vi.mocked(Message.findByPk).mockResolvedValue(mockMessage as any)

      vi.mocked(downloadAndSaveMedia).mockResolvedValue({
        localPath: "1/abc123.jpg",
        mediaType: "image",
        mimeType: "image/jpeg"
      })

      const body = buildWebhookBody({
        contacts: [{ profile: { name: "John" }, wa_id: "5511888888888" }],
        messages: [
          {
            id: "wamid.media1",
            from: "5511888888888",
            timestamp: "1700000000",
            type: "image",
            image: { id: "media-img-1", mime_type: "image/jpeg", caption: "Check this out" }
          }
        ]
      })

      await processWebhook(body)

      expect(downloadAndSaveMedia).toHaveBeenCalledWith("media-img-1", "token-abc", 1)
      expect(Message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mediaUrl: "1/abc123.jpg",
          mediaType: "image",
          body: "Check this out"
        })
      )
    })

    it("handles status updates (delivered)", async () => {
      const mockMessage = buildMessage({ id: 30, remoteJid: "wamid.status1", ack: 1 })
      vi.mocked(Message.findOne).mockResolvedValue(mockMessage as any)

      const mockTicket = buildTicket({ id: 10 })
      vi.mocked(Ticket.findByPk).mockResolvedValue(mockTicket as any)

      const body = buildWebhookBody({
        statuses: [
          {
            id: "wamid.status1",
            status: "delivered",
            timestamp: "1700000001",
            recipient_id: "5511888888888"
          }
        ]
      })

      await processWebhook(body)

      expect(mockMessage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ack: 2,
          status: "delivered"
        })
      )
      expect(emitToTicket).toHaveBeenCalledWith(10, "message:updated", mockMessage)
    })

    it("does not downgrade ack on status update", async () => {
      const mockMessage = buildMessage({ id: 30, remoteJid: "wamid.status2", ack: 3 })
      vi.mocked(Message.findOne).mockResolvedValue(mockMessage as any)

      const body = buildWebhookBody({
        statuses: [
          {
            id: "wamid.status2",
            status: "delivered",
            timestamp: "1700000001",
            recipient_id: "5511888888888"
          }
        ]
      })

      await processWebhook(body)

      expect(mockMessage.update).not.toHaveBeenCalled()
    })

    it("ignores status updates for unknown messages", async () => {
      vi.mocked(Message.findOne).mockResolvedValue(null)

      const body = buildWebhookBody({
        statuses: [
          {
            id: "wamid.unknown",
            status: "delivered",
            timestamp: "1700000001",
            recipient_id: "5511888888888"
          }
        ]
      })

      await processWebhook(body)

      expect(emitToTicket).not.toHaveBeenCalled()
    })

    it("processes location messages", async () => {
      const mockWhatsApp = {
        id: 1,
        tenantId: 1,
        wabaPhoneNumberId: "phone-123",
        wabaToken: "token-abc"
      }
      vi.mocked(WhatsApp.findOne).mockResolvedValue(mockWhatsApp as any)

      const mockContact = buildContact({ id: 5 })
      vi.mocked(Contact.findOne).mockResolvedValue(mockContact as any)

      const mockTicket = buildTicket({ id: 10, status: "open", unreadMessages: 0 })
      vi.mocked(Ticket.findOne).mockResolvedValue(mockTicket as any)
      vi.mocked(Ticket.findByPk).mockResolvedValue(mockTicket as any)

      vi.mocked(Message.findOne).mockResolvedValue(null)
      const mockMessage = buildMessage({ id: 20 })
      vi.mocked(Message.create).mockResolvedValue(mockMessage as any)
      vi.mocked(Message.findByPk).mockResolvedValue(mockMessage as any)

      const body = buildWebhookBody({
        contacts: [{ profile: { name: "John" }, wa_id: "5511888888888" }],
        messages: [
          {
            id: "wamid.loc1",
            from: "5511888888888",
            timestamp: "1700000000",
            type: "location",
            location: { latitude: -23.5, longitude: -46.6, name: "Office", address: "123 St" }
          }
        ]
      })

      await processWebhook(body)

      expect(Message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining("[Location]")
        })
      )
    })

    it("handles failed status update", async () => {
      const mockMessage = buildMessage({ id: 30, remoteJid: "wamid.fail1", ack: 0 })
      vi.mocked(Message.findOne).mockResolvedValue(mockMessage as any)

      const mockTicket = buildTicket({ id: 10 })
      vi.mocked(Ticket.findByPk).mockResolvedValue(mockTicket as any)

      const body = buildWebhookBody({
        statuses: [
          {
            id: "wamid.fail1",
            status: "failed",
            timestamp: "1700000001",
            recipient_id: "5511888888888"
          }
        ]
      })

      await processWebhook(body)

      expect(mockMessage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ack: -1,
          status: "failed"
        })
      )
    })
  })
})

import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/models/Message", () => ({
  default: {
    findOne: vi.fn(),
    findByPk: vi.fn(),
    findAndCountAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn()
  }
}))

vi.mock("@/models/Ticket", () => ({
  default: {
    findOne: vi.fn(),
    findByPk: vi.fn()
  }
}))

vi.mock("@/models/Contact", () => ({
  default: {}
}))

vi.mock("@/libs/queues", () => ({
  getQueue: vi.fn()
}))

vi.mock("@/jobs/SendMessageJob", () => ({
  QUEUE_NAME: "send-message"
}))

vi.mock("@/helpers/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

import { listMessages, createMessage } from "../MessageService"
import Message from "@/models/Message"
import Ticket from "@/models/Ticket"
import { getQueue } from "@/libs/queues"
import { buildMessage, buildTicket } from "@/__tests__/factories"
import { AppError } from "@/helpers/AppError"

describe("MessageService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listMessages", () => {
    it("returns paginated messages for a ticket", async () => {
      const mockTicket = buildTicket({ id: 1 })
      vi.mocked(Ticket.findOne).mockResolvedValue(mockTicket as unknown as Ticket)

      const mockMessages = [
        buildMessage({ id: 1, body: "Hello" }),
        buildMessage({ id: 2, body: "World" })
      ]
      vi.mocked(Message.findAndCountAll).mockResolvedValue({
        rows: mockMessages,
        count: 2
      } as any)

      const result = await listMessages({ ticketId: 1, tenantId: 1 })

      expect(result.messages).toHaveLength(2)
      expect(result.count).toBe(2)
      expect(result.hasMore).toBe(false)
      expect(Ticket.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1, tenantId: 1 }
        })
      )
    })

    it("throws error when ticket is not found", async () => {
      vi.mocked(Ticket.findOne).mockResolvedValue(null)

      await expect(
        listMessages({ ticketId: 999, tenantId: 1 })
      ).rejects.toThrow(AppError)
      await expect(
        listMessages({ ticketId: 999, tenantId: 1 })
      ).rejects.toThrow("Ticket not found")
    })
  })

  describe("createMessage", () => {
    it("creates a message and updates the ticket", async () => {
      const mockTicket = buildTicket({ id: 1, contactId: 5, unreadMessages: 0 })
      vi.mocked(Ticket.findOne).mockResolvedValue(mockTicket as unknown as Ticket)

      const createdMessage = buildMessage({ id: 10, body: "Hello there", ticketId: 1 })
      vi.mocked(Message.create).mockResolvedValue(createdMessage as unknown as Message)
      vi.mocked(Message.findByPk).mockResolvedValue(createdMessage as unknown as Message)

      const updatedTicket = buildTicket({ id: 1 })
      vi.mocked(Ticket.findByPk).mockResolvedValue(updatedTicket as unknown as Ticket)

      const mockQueue = { add: vi.fn().mockResolvedValue(undefined) }
      vi.mocked(getQueue).mockReturnValue(mockQueue as any)

      const result = await createMessage(1, 1, {
        body: "Hello there"
      })

      expect(result).toBeDefined()
      expect(Message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ticketId: 1,
          body: "Hello there",
          fromMe: true
        })
      )
      expect(mockTicket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          lastMessage: "Hello there"
        })
      )
    })

    it("updates ticket unreadMessages for incoming messages", async () => {
      const mockTicket = buildTicket({ id: 1, contactId: 5, unreadMessages: 3 })
      vi.mocked(Ticket.findOne).mockResolvedValue(mockTicket as unknown as Ticket)

      const createdMessage = buildMessage({ id: 11, body: "Incoming msg" })
      vi.mocked(Message.create).mockResolvedValue(createdMessage as unknown as Message)
      vi.mocked(Message.findByPk).mockResolvedValue(createdMessage as unknown as Message)

      const updatedTicket = buildTicket({ id: 1 })
      vi.mocked(Ticket.findByPk).mockResolvedValue(updatedTicket as unknown as Ticket)

      await createMessage(1, 1, {
        body: "Incoming msg",
        fromMe: false
      })

      expect(mockTicket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          unreadMessages: 4
        })
      )
    })

    it("enqueues message for WhatsApp delivery when fromMe", async () => {
      const mockTicket = buildTicket({ id: 1, contactId: 5, unreadMessages: 0 })
      vi.mocked(Ticket.findOne).mockResolvedValue(mockTicket as unknown as Ticket)

      const createdMessage = buildMessage({ id: 12, body: "Send me" })
      vi.mocked(Message.create).mockResolvedValue(createdMessage as unknown as Message)
      vi.mocked(Message.findByPk).mockResolvedValue(createdMessage as unknown as Message)

      const updatedTicket = buildTicket({ id: 1 })
      vi.mocked(Ticket.findByPk).mockResolvedValue(updatedTicket as unknown as Ticket)

      const mockQueue = { add: vi.fn().mockResolvedValue(undefined) }
      vi.mocked(getQueue).mockReturnValue(mockQueue as any)

      await createMessage(1, 1, { body: "Send me" })

      expect(getQueue).toHaveBeenCalledWith("send-message")
      expect(mockQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: 12,
          ticketId: 1,
          tenantId: 1
        })
      )
    })

    it("does not enqueue when fromMe is false", async () => {
      const mockTicket = buildTicket({ id: 1, contactId: 5, unreadMessages: 0 })
      vi.mocked(Ticket.findOne).mockResolvedValue(mockTicket as unknown as Ticket)

      const createdMessage = buildMessage({ id: 13, body: "External" })
      vi.mocked(Message.create).mockResolvedValue(createdMessage as unknown as Message)
      vi.mocked(Message.findByPk).mockResolvedValue(createdMessage as unknown as Message)

      const updatedTicket = buildTicket({ id: 1 })
      vi.mocked(Ticket.findByPk).mockResolvedValue(updatedTicket as unknown as Ticket)

      await createMessage(1, 1, { body: "External", fromMe: false })

      expect(getQueue).not.toHaveBeenCalled()
    })
  })
})

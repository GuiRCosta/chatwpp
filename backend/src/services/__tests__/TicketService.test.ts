import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/models/Ticket", () => ({
  default: {
    findOne: vi.fn(),
    findByPk: vi.fn(),
    findAndCountAll: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn()
  }
}))

vi.mock("@/models/Contact", () => ({
  default: {}
}))

vi.mock("@/models/User", () => ({
  default: {}
}))

vi.mock("@/models/Queue", () => ({
  default: {}
}))

vi.mock("@/models/WhatsApp", () => ({
  default: {}
}))

vi.mock("@/models/Message", () => ({
  default: {
    destroy: vi.fn()
  }
}))

vi.mock("@/models/TicketLog", () => ({
  default: {
    create: vi.fn(),
    destroy: vi.fn()
  }
}))

vi.mock("@/models/TicketNote", () => ({
  default: {
    destroy: vi.fn()
  }
}))

vi.mock("uuid", () => {
  return {
    v4: () => "abcdef12-3456-7890-abcd-ef1234567890"
  }
})

import {
  listTickets,
  findTicketById,
  createTicket,
  updateTicket,
  deleteTicket
} from "../TicketService"
import Ticket from "@/models/Ticket"
import Message from "@/models/Message"
import TicketLog from "@/models/TicketLog"
import TicketNote from "@/models/TicketNote"
import { buildTicket } from "@/__tests__/factories"
import { AppError } from "@/helpers/AppError"

describe("TicketService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listTickets", () => {
    it("returns paginated tickets", async () => {
      const mockTickets = [
        buildTicket({ id: 1 }),
        buildTicket({ id: 2 })
      ]
      vi.mocked(Ticket.findAndCountAll).mockResolvedValue({
        rows: mockTickets,
        count: 2
      } as any)

      const result = await listTickets({ tenantId: 1 })

      expect(result.tickets).toHaveLength(2)
      expect(result.count).toBe(2)
      expect(result.hasMore).toBe(false)
      expect(Ticket.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 1 }),
          limit: 40,
          offset: 0
        })
      )
    })

    it("filters tickets by status", async () => {
      vi.mocked(Ticket.findAndCountAll).mockResolvedValue({
        rows: [],
        count: 0
      } as any)

      await listTickets({ tenantId: 1, status: "open" })

      expect(Ticket.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 1, status: "open" })
        })
      )
    })

    it("filters tickets by userId when showAll is false", async () => {
      vi.mocked(Ticket.findAndCountAll).mockResolvedValue({
        rows: [],
        count: 0
      } as any)

      await listTickets({ tenantId: 1, userId: 5, showAll: false })

      expect(Ticket.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 1, userId: 5 })
        })
      )
    })
  })

  describe("findTicketById", () => {
    it("returns a ticket when found", async () => {
      const mockTicket = buildTicket({ id: 3 })
      vi.mocked(Ticket.findOne).mockResolvedValue(mockTicket as unknown as Ticket)

      const result = await findTicketById(3, 1)

      expect(result).toBeDefined()
      expect(Ticket.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 3, tenantId: 1 }
        })
      )
    })

    it("throws AppError when ticket is not found", async () => {
      vi.mocked(Ticket.findOne).mockResolvedValue(null)

      await expect(findTicketById(999, 1)).rejects.toThrow(AppError)
      await expect(findTicketById(999, 1)).rejects.toThrow("Ticket not found")
    })
  })

  describe("createTicket", () => {
    it("creates a ticket successfully", async () => {
      const createdTicket = buildTicket({ id: 10, contactId: 5 })

      vi.mocked(Ticket.findOne)
        .mockResolvedValueOnce(null) // openTicket check
        .mockResolvedValueOnce(createdTicket as unknown as Ticket) // findTicketById

      vi.mocked(Ticket.create).mockResolvedValue(createdTicket as unknown as Ticket)

      const result = await createTicket(1, 1, { contactId: 5 })

      expect(result).toBeDefined()
      expect(Ticket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          contactId: 5,
          userId: 1,
          protocol: "ABCDEF12"
        })
      )
      expect(TicketLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ticketId: 10,
          type: "created"
        })
      )
    })

    it("throws error when open ticket already exists for contact", async () => {
      const existingTicket = buildTicket({ contactId: 5, status: "open" })
      vi.mocked(Ticket.findOne).mockResolvedValue(existingTicket as unknown as Ticket)

      await expect(
        createTicket(1, 1, { contactId: 5 })
      ).rejects.toThrow("An open ticket already exists for this contact")
    })
  })

  describe("updateTicket", () => {
    it("updates ticket and logs status change", async () => {
      const mockTicket = buildTicket({ id: 1, status: "open", userId: 1 })

      vi.mocked(Ticket.findOne)
        .mockResolvedValueOnce(mockTicket as unknown as Ticket) // initial find
        .mockResolvedValueOnce(mockTicket as unknown as Ticket) // findTicketById

      const result = await updateTicket(1, 1, 1, { status: "closed" })

      expect(result).toBeDefined()
      expect(mockTicket.update).toHaveBeenCalledWith({ status: "closed" })
      expect(TicketLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ticketId: 1,
          type: "status_changed",
          payload: expect.objectContaining({ from: "open", to: "closed" })
        })
      )
    })

    it("throws error when ticket is not found", async () => {
      vi.mocked(Ticket.findOne).mockResolvedValue(null)

      await expect(
        updateTicket(999, 1, 1, { status: "closed" })
      ).rejects.toThrow("Ticket not found")
    })
  })

  describe("deleteTicket", () => {
    it("deletes a ticket and related records", async () => {
      const mockTicket = buildTicket({ id: 1 })
      vi.mocked(Ticket.findOne).mockResolvedValue(mockTicket as unknown as Ticket)

      await deleteTicket(1, 1)

      expect(Message.destroy).toHaveBeenCalledWith(
        expect.objectContaining({ where: { ticketId: 1 } })
      )
      expect(TicketLog.destroy).toHaveBeenCalledWith(
        expect.objectContaining({ where: { ticketId: 1 } })
      )
      expect(TicketNote.destroy).toHaveBeenCalledWith(
        expect.objectContaining({ where: { ticketId: 1 } })
      )
      expect(mockTicket.destroy).toHaveBeenCalled()
    })

    it("throws error when ticket is not found", async () => {
      vi.mocked(Ticket.findOne).mockResolvedValue(null)

      await expect(deleteTicket(999, 1)).rejects.toThrow("Ticket not found")
    })
  })
})

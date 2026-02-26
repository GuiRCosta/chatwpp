import { describe, it, expect, vi, beforeEach } from "vitest"

// Unmock @/libs/socket since setup.ts mocks it globally, and we want the real implementation
vi.unmock("@/libs/socket")

const mockEmit = vi.fn()
const mockTo = vi.fn(() => ({ emit: mockEmit }))
const mockJoin = vi.fn()
const mockLeave = vi.fn()
const mockUse = vi.fn()
const mockServerOn = vi.fn()

vi.mock("socket.io", () => ({
  Server: function Server() {
    return { to: mockTo, use: mockUse, on: mockServerOn }
  }
}))

vi.mock("jsonwebtoken", () => ({
  verify: vi.fn()
}))

vi.mock("@/config/auth", () => ({
  default: { secret: "test-secret" }
}))

vi.mock("@/helpers/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

import { verify } from "jsonwebtoken"
import { initSocket, getIO, emitToTenant, emitToUser, emitToTicket } from "../socket"
import http from "http"

describe("socket", () => {
  beforeEach(() => {
    mockEmit.mockClear()
    mockTo.mockClear().mockReturnValue({ emit: mockEmit })
    mockUse.mockClear()
    mockServerOn.mockClear()
    mockJoin.mockClear()
    mockLeave.mockClear()
    vi.mocked(verify).mockReset()
  })

  describe("initSocket", () => {
    it("registers authentication middleware and connection handler", () => {
      const httpServer = http.createServer()

      initSocket(httpServer)

      expect(mockUse).toHaveBeenCalledWith(expect.any(Function))
      expect(mockServerOn).toHaveBeenCalledWith("connection", expect.any(Function))
    })

    it("authentication middleware rejects when no token", () => {
      const httpServer = http.createServer()
      initSocket(httpServer)

      const middleware = mockUse.mock.calls[0][0]
      const socket = {
        handshake: { auth: {}, query: {} },
        data: {}
      }
      const next = vi.fn()

      middleware(socket, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Authentication error: Token required"
        })
      )
    })

    it("authentication middleware sets socket data on valid token", () => {
      vi.mocked(verify).mockReturnValue({
        id: 1,
        tenantId: 2,
        profile: "admin"
      } as any)

      const httpServer = http.createServer()
      initSocket(httpServer)

      const middleware = mockUse.mock.calls[0][0]
      const socket = {
        handshake: { auth: { token: "valid-token" }, query: {} },
        data: {} as Record<string, unknown>
      }
      const next = vi.fn()

      middleware(socket, next)

      expect(socket.data).toEqual({
        userId: 1,
        tenantId: 2,
        profile: "admin"
      })
      expect(next).toHaveBeenCalledWith()
    })

    it("authentication middleware rejects invalid token", () => {
      vi.mocked(verify).mockImplementation(() => {
        throw new Error("invalid token")
      })

      const httpServer = http.createServer()
      initSocket(httpServer)

      const middleware = mockUse.mock.calls[0][0]
      const socket = {
        handshake: { auth: { token: "bad-token" }, query: {} },
        data: {}
      }
      const next = vi.fn()

      middleware(socket, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Authentication error: Invalid token"
        })
      )
    })

    it("authentication middleware reads token from query fallback", () => {
      vi.mocked(verify).mockReturnValue({
        id: 3,
        tenantId: 4,
        profile: "agent"
      } as any)

      const httpServer = http.createServer()
      initSocket(httpServer)

      const middleware = mockUse.mock.calls[0][0]
      const socket = {
        handshake: { auth: {}, query: { token: "query-token" } },
        data: {} as Record<string, unknown>
      }
      const next = vi.fn()

      middleware(socket, next)

      expect(verify).toHaveBeenCalledWith("query-token", "test-secret")
      expect(next).toHaveBeenCalledWith()
    })

    it("connection handler joins tenant and user rooms", () => {
      const httpServer = http.createServer()
      initSocket(httpServer)

      const connectionCall = mockServerOn.mock.calls.find(
        (c: any[]) => c[0] === "connection"
      )
      const connectionHandler = connectionCall![1]

      const socketOn = vi.fn()
      const socket = {
        data: { tenantId: 1, userId: 5 },
        join: mockJoin,
        on: socketOn
      }

      connectionHandler(socket)

      expect(mockJoin).toHaveBeenCalledWith("tenant:1")
      expect(mockJoin).toHaveBeenCalledWith("user:5")
    })

    it("connection handler supports joinTicket and leaveTicket", () => {
      const httpServer = http.createServer()
      initSocket(httpServer)

      const connectionCall = mockServerOn.mock.calls.find(
        (c: any[]) => c[0] === "connection"
      )
      const connectionHandler = connectionCall![1]

      const socketOn = vi.fn()
      const socket = {
        data: { tenantId: 1, userId: 5 },
        join: mockJoin,
        leave: mockLeave,
        on: socketOn
      }

      connectionHandler(socket)

      const joinTicketHandler = socketOn.mock.calls.find(
        (c: [string, Function]) => c[0] === "joinTicket"
      )
      const leaveTicketHandler = socketOn.mock.calls.find(
        (c: [string, Function]) => c[0] === "leaveTicket"
      )

      expect(joinTicketHandler).toBeDefined()
      expect(leaveTicketHandler).toBeDefined()

      joinTicketHandler![1](42)
      expect(mockJoin).toHaveBeenCalledWith("ticket:42")

      leaveTicketHandler![1](42)
      expect(mockLeave).toHaveBeenCalledWith("ticket:42")
    })
  })

  describe("getIO", () => {
    it("returns the IO instance after initialization", () => {
      const httpServer = http.createServer()
      initSocket(httpServer)

      const io = getIO()

      expect(io).toBeDefined()
    })
  })

  describe("emitToTenant", () => {
    it("emits event to tenant room", () => {
      const httpServer = http.createServer()
      initSocket(httpServer)

      emitToTenant(1, "ticket:created", { id: 1 })

      expect(mockTo).toHaveBeenCalledWith("tenant:1")
      expect(mockEmit).toHaveBeenCalledWith("ticket:created", { id: 1 })
    })
  })

  describe("emitToUser", () => {
    it("emits event to user room", () => {
      const httpServer = http.createServer()
      initSocket(httpServer)

      emitToUser(5, "notification:new", { message: "Hello" })

      expect(mockTo).toHaveBeenCalledWith("user:5")
      expect(mockEmit).toHaveBeenCalledWith("notification:new", { message: "Hello" })
    })
  })

  describe("emitToTicket", () => {
    it("emits event to ticket room", () => {
      const httpServer = http.createServer()
      initSocket(httpServer)

      emitToTicket(10, "message:created", { body: "Hi" })

      expect(mockTo).toHaveBeenCalledWith("ticket:10")
      expect(mockEmit).toHaveBeenCalledWith("message:created", { body: "Hi" })
    })
  })
})

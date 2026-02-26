import { describe, it, expect, vi, beforeEach } from "vitest"
import { connectSocket, disconnectSocket, getSocket } from "../socket"
import { io } from "socket.io-client"

const mockOn = vi.fn()
const mockDisconnect = vi.fn()

const mockSocket = {
  on: mockOn,
  disconnect: mockDisconnect,
  connected: true
}

vi.mock("socket.io-client", () => ({
  io: vi.fn().mockReturnValue({
    on: vi.fn(),
    disconnect: vi.fn(),
    connected: true
  })
}))

describe("socket", () => {
  beforeEach(() => {
    // Reset state by disconnecting any existing socket
    disconnectSocket()

    // Reconfigure the mock to return our controlled mockSocket
    vi.mocked(io).mockReturnValue(mockSocket as never)
    mockOn.mockClear()
    mockDisconnect.mockClear()
  })

  it("connectSocket creates and returns a socket", () => {
    const socket = connectSocket("test-token")

    expect(socket).toBeDefined()
    expect(socket).toBe(mockSocket)
  })

  it("connectSocket registers event listeners", () => {
    connectSocket("test-token")

    const eventNames = mockOn.mock.calls.map(
      (call: [string, ...unknown[]]) => call[0]
    )
    expect(eventNames).toContain("connect")
    expect(eventNames).toContain("disconnect")
    expect(eventNames).toContain("connect_error")
  })

  it("disconnectSocket clears the socket", () => {
    connectSocket("test-token")
    expect(getSocket()).toBe(mockSocket)

    disconnectSocket()
    expect(mockDisconnect).toHaveBeenCalled()
    expect(getSocket()).toBeNull()
  })

  it("getSocket returns null when no socket connected", () => {
    expect(getSocket()).toBeNull()
  })

  it("getSocket returns current socket after connect", () => {
    connectSocket("test-token")

    expect(getSocket()).toBe(mockSocket)
  })

  it("connectSocket disconnects existing socket before creating new one", () => {
    connectSocket("token-1")
    mockDisconnect.mockClear()

    connectSocket("token-2")

    expect(mockDisconnect).toHaveBeenCalledTimes(1)
  })
})

import { vi } from "vitest"

// Mock logger to suppress output
vi.mock("@/helpers/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

// Mock socket emissions
vi.mock("@/libs/socket", () => ({
  initSocket: vi.fn(),
  getIO: vi.fn(),
  emitToTenant: vi.fn(),
  emitToUser: vi.fn(),
  emitToTicket: vi.fn()
}))

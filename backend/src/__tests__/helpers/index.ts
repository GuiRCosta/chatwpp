import { vi } from "vitest"
import jwt from "jsonwebtoken"
import authConfig from "@/config/auth"

export function createTestToken(overrides: Record<string, unknown> = {}) {
  const payload = {
    id: 1,
    tenantId: 1,
    profile: "admin",
    ...overrides
  }
  return jwt.sign(payload, authConfig.secret, { expiresIn: "1h" })
}

export function createMockRequest(overrides: Record<string, unknown> = {}) {
  return {
    userId: 1,
    tenantId: 1,
    userProfile: "admin",
    params: {},
    query: {},
    body: {},
    headers: {},
    ...overrides
  }
}

export function createMockResponse() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    sendStatus: vi.fn().mockReturnThis()
  }
  return res
}

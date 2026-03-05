import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockAuthenticate, mockPing } = vi.hoisted(() => ({
  mockAuthenticate: vi.fn(),
  mockPing: vi.fn()
}))

vi.mock("@/models/Tenant", () => ({
  default: {
    sequelize: {
      authenticate: mockAuthenticate
    }
  }
}))

vi.mock("@/config/redis", () => ({
  getRedisClient: vi.fn(() => ({ ping: mockPing }))
}))

vi.mock("@/libs/queues", () => ({
  getAllQueues: vi.fn(() => [])
}))

import { getHealth, type HealthResult } from "../HealthService"
import { getRedisClient } from "@/config/redis"
import { getAllQueues } from "@/libs/queues"

const mockGetRedisClient = vi.mocked(getRedisClient)
const mockGetAllQueues = vi.mocked(getAllQueues)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getHealth", () => {
  it("returns healthy when all dependencies are up", async () => {
    mockAuthenticate.mockResolvedValue(undefined)
    mockPing.mockResolvedValue("PONG")
    mockGetAllQueues.mockReturnValue([
      { name: "SendMessage", isReady: vi.fn().mockResolvedValue(true) },
      { name: "Campaign", isReady: vi.fn().mockResolvedValue(true) }
    ] as never)

    const result = await getHealth()

    expect(result.status).toBe("healthy")
    expect(result.checks.postgres.status).toBe("up")
    expect(result.checks.redis.status).toBe("up")
    expect(result.checks.bull.status).toBe("up")
    expect(result.checks.bull.activeQueues).toBe(2)
    expect(typeof result.checks.postgres.latencyMs).toBe("number")
    expect(typeof result.checks.redis.latencyMs).toBe("number")
  })

  it("returns unhealthy when postgres is down", async () => {
    mockAuthenticate.mockRejectedValue(new Error("connection refused"))
    mockPing.mockResolvedValue("PONG")
    mockGetAllQueues.mockReturnValue([])

    const result = await getHealth()

    expect(result.status).toBe("unhealthy")
    expect(result.checks.postgres.status).toBe("down")
    expect(result.checks.postgres.error).toBe("connection refused")
    expect(result.checks.redis.status).toBe("up")
  })

  it("returns degraded when redis is down", async () => {
    mockAuthenticate.mockResolvedValue(undefined)
    mockPing.mockRejectedValue(new Error("ECONNREFUSED"))
    mockGetAllQueues.mockReturnValue([])

    const result = await getHealth()

    expect(result.status).toBe("degraded")
    expect(result.checks.postgres.status).toBe("up")
    expect(result.checks.redis.status).toBe("down")
    expect(result.checks.redis.error).toBe("ECONNREFUSED")
  })

  it("returns degraded when bull queues have failures", async () => {
    mockAuthenticate.mockResolvedValue(undefined)
    mockPing.mockResolvedValue("PONG")
    mockGetAllQueues.mockReturnValue([
      { name: "SendMessage", isReady: vi.fn().mockResolvedValue(true) },
      { name: "Campaign", isReady: vi.fn().mockRejectedValue(new Error("queue error")) }
    ] as never)

    const result = await getHealth()

    expect(result.status).toBe("degraded")
    expect(result.checks.bull.status).toBe("degraded")
    expect(result.checks.bull.activeQueues).toBe(1)
  })

  it("returns unhealthy when postgres and redis are both down", async () => {
    mockAuthenticate.mockRejectedValue(new Error("pg down"))
    mockPing.mockRejectedValue(new Error("redis down"))
    mockGetAllQueues.mockReturnValue([])

    const result = await getHealth()

    expect(result.status).toBe("unhealthy")
    expect(result.checks.postgres.status).toBe("down")
    expect(result.checks.redis.status).toBe("down")
  })

  it("returns healthy when no queues are registered", async () => {
    mockAuthenticate.mockResolvedValue(undefined)
    mockPing.mockResolvedValue("PONG")
    mockGetAllQueues.mockReturnValue([])

    const result = await getHealth()

    expect(result.status).toBe("healthy")
    expect(result.checks.bull.status).toBe("up")
    expect(result.checks.bull.activeQueues).toBe(0)
  })

  it("handles getRedisClient throwing", async () => {
    mockAuthenticate.mockResolvedValue(undefined)
    mockGetRedisClient.mockImplementation(() => {
      throw new Error("no client")
    })
    mockGetAllQueues.mockReturnValue([])

    const result = await getHealth()

    expect(result.status).toBe("degraded")
    expect(result.checks.redis.status).toBe("down")
    expect(result.checks.redis.error).toBe("no client")
  })

  it("result shape matches HealthResult type", async () => {
    mockAuthenticate.mockResolvedValue(undefined)
    mockPing.mockResolvedValue("PONG")
    mockGetAllQueues.mockReturnValue([])

    const result: HealthResult = await getHealth()

    expect(result).toHaveProperty("status")
    expect(result).toHaveProperty("checks")
    expect(result.checks).toHaveProperty("postgres")
    expect(result.checks).toHaveProperty("redis")
    expect(result.checks).toHaveProperty("bull")
  })
})

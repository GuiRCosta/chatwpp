import { describe, it, expect, vi, beforeEach } from "vitest"

const mockProcess = vi.fn()
const mockOn = vi.fn()
const mockClose = vi.fn().mockResolvedValue(undefined)

vi.mock("bull", () => {
  return {
    default: function () {
      return {
        process: mockProcess,
        on: mockOn,
        close: mockClose
      }
    }
  }
})

vi.mock("@/config/redis", () => ({
  getRedisConfig: () => ({
    host: "localhost",
    port: 6379,
    password: undefined,
    maxRetriesPerRequest: null
  })
}))

vi.mock("@/jobs/SendMessageJob", () => ({
  QUEUE_NAME: "SendMessage",
  process: vi.fn()
}))

vi.mock("@/jobs/BulkDispatchJob", () => ({
  QUEUE_NAME: "BulkDispatch",
  process: vi.fn()
}))

vi.mock("@/jobs/CampaignJob", () => ({
  QUEUE_NAME: "Campaign",
  process: vi.fn()
}))

vi.mock("@/jobs/CleanupTicketsJob", () => ({
  QUEUE_NAME: "CleanupTickets",
  process: vi.fn()
}))

vi.mock("@/helpers/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

describe("queues", () => {
  beforeEach(() => {
    mockProcess.mockClear()
    mockOn.mockClear()
    mockClose.mockClear().mockResolvedValue(undefined)
  })

  async function loadQueuesModule() {
    vi.resetModules()
    const mod = await import("../queues")
    return mod
  }

  describe("initQueues", () => {
    it("creates all defined queues and sets up processors", async () => {
      const { initQueues } = await loadQueuesModule()

      initQueues()

      // 4 queues, each calls process once
      expect(mockProcess).toHaveBeenCalledTimes(4)
    })

    it("sets up processors with correct concurrency", async () => {
      const { initQueues } = await loadQueuesModule()

      initQueues()

      // SendMessage should have concurrency 5
      const sendMessageCall = mockProcess.mock.calls.find(
        (call: any[]) => call[0] === 5
      )
      expect(sendMessageCall).toBeDefined()

      // Other queues should have concurrency 1
      const concurrency1Calls = mockProcess.mock.calls.filter(
        (call: any[]) => call[0] === 1
      )
      expect(concurrency1Calls.length).toBe(3)
    })

    it("registers failed and completed event handlers", async () => {
      const { initQueues } = await loadQueuesModule()

      initQueues()

      const failedCalls = mockOn.mock.calls.filter(
        (call: any[]) => call[0] === "failed"
      )
      const completedCalls = mockOn.mock.calls.filter(
        (call: any[]) => call[0] === "completed"
      )

      expect(failedCalls.length).toBe(4)
      expect(completedCalls.length).toBe(4)
    })
  })

  describe("getQueue", () => {
    it("returns a queue by name", async () => {
      const { initQueues, getQueue } = await loadQueuesModule()

      initQueues()

      const queue = getQueue("SendMessage")

      expect(queue).toBeDefined()
    })

    it("throws when queue is not found", async () => {
      const { getQueue } = await loadQueuesModule()

      expect(() => getQueue("NonExistent")).toThrow(
        'Queue "NonExistent" not found. Did you call initQueues()?'
      )
    })
  })

  describe("getAllQueues", () => {
    it("returns all initialized queues", async () => {
      const { initQueues, getAllQueues } = await loadQueuesModule()

      initQueues()

      const allQueues = getAllQueues()

      expect(allQueues).toHaveLength(4)
    })
  })

  describe("closeQueues", () => {
    it("closes all queues and clears the map", async () => {
      const { initQueues, closeQueues, getQueue } = await loadQueuesModule()

      initQueues()

      await closeQueues()

      expect(mockClose).toHaveBeenCalledTimes(4)

      expect(() => getQueue("SendMessage")).toThrow(
        'Queue "SendMessage" not found'
      )
    })
  })
})

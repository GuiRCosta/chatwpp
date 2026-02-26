import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

vi.mock("@/models/Campaign", () => ({
  default: {
    findAll: vi.fn()
  }
}))

vi.mock("@/libs/queues", () => ({
  getQueue: vi.fn()
}))

vi.mock("@/jobs/CampaignJob", () => ({
  QUEUE_NAME: "campaign"
}))

vi.mock("@/jobs/CleanupTicketsJob", () => ({
  QUEUE_NAME: "cleanup-tickets"
}))

vi.mock("@/helpers/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

vi.mock("node-cron", () => ({
  default: {
    schedule: vi.fn()
  }
}))

import cron from "node-cron"
import Campaign from "@/models/Campaign"
import { getQueue } from "@/libs/queues"
import { initScheduledJobs, stopScheduledJobs } from "../ScheduledJobs"
import { buildCampaign } from "@/__tests__/factories"

describe("ScheduledJobs", () => {
  let cronCallbacks: Map<string, () => Promise<void>>
  let mockTask: { stop: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    vi.clearAllMocks()
    cronCallbacks = new Map()
    mockTask = { stop: vi.fn() }

    vi.mocked(cron.schedule).mockImplementation((expression: string, callback: () => Promise<void>) => {
      cronCallbacks.set(expression, callback)
      return mockTask as any
    })
  })

  afterEach(() => {
    stopScheduledJobs()
  })

  describe("initScheduledJobs", () => {
    it("schedules campaign check every minute and ticket cleanup every 30 minutes", () => {
      initScheduledJobs()

      expect(cron.schedule).toHaveBeenCalledTimes(2)
      expect(cron.schedule).toHaveBeenCalledWith("*/1 * * * *", expect.any(Function))
      expect(cron.schedule).toHaveBeenCalledWith("*/30 * * * *", expect.any(Function))
    })
  })

  describe("stopScheduledJobs", () => {
    it("stops all scheduled tasks", () => {
      initScheduledJobs()

      stopScheduledJobs()

      expect(mockTask.stop).toHaveBeenCalledTimes(2)
    })
  })

  describe("enqueueScheduledCampaigns (campaign check)", () => {
    it("enqueues scheduled campaigns that are due", async () => {
      initScheduledJobs()

      const campaign1 = buildCampaign({ id: 1, status: "scheduled", tenantId: 1 })
      const campaign2 = buildCampaign({ id: 2, status: "scheduled", tenantId: 1 })
      vi.mocked(Campaign.findAll).mockResolvedValue([campaign1, campaign2] as any)

      const mockQueue = { add: vi.fn().mockResolvedValue(undefined) }
      vi.mocked(getQueue).mockReturnValue(mockQueue as any)

      const campaignCheck = cronCallbacks.get("*/1 * * * *")
      await campaignCheck!()

      expect(Campaign.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "scheduled" })
        })
      )
      expect(campaign1.update).toHaveBeenCalledWith({ status: "queued" })
      expect(campaign2.update).toHaveBeenCalledWith({ status: "queued" })
      expect(mockQueue.add).toHaveBeenCalledTimes(2)
      expect(mockQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({ campaignId: 1, tenantId: 1 })
      )
      expect(mockQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({ campaignId: 2, tenantId: 1 })
      )
    })

    it("does nothing when no campaigns are due", async () => {
      initScheduledJobs()

      vi.mocked(Campaign.findAll).mockResolvedValue([])

      const campaignCheck = cronCallbacks.get("*/1 * * * *")
      await campaignCheck!()

      expect(getQueue).not.toHaveBeenCalled()
    })

    it("handles errors gracefully without crashing", async () => {
      initScheduledJobs()

      vi.mocked(Campaign.findAll).mockRejectedValue(new Error("DB error"))

      const campaignCheck = cronCallbacks.get("*/1 * * * *")

      await expect(campaignCheck!()).resolves.not.toThrow()
    })
  })

  describe("enqueueTicketCleanup (ticket cleanup)", () => {
    it("enqueues a ticket cleanup job", async () => {
      initScheduledJobs()

      const mockQueue = { add: vi.fn().mockResolvedValue(undefined) }
      vi.mocked(getQueue).mockReturnValue(mockQueue as any)

      const ticketCleanup = cronCallbacks.get("*/30 * * * *")
      await ticketCleanup!()

      expect(getQueue).toHaveBeenCalledWith("cleanup-tickets")
      expect(mockQueue.add).toHaveBeenCalledWith({})
    })

    it("handles errors gracefully without crashing", async () => {
      initScheduledJobs()

      vi.mocked(getQueue).mockImplementation(() => {
        throw new Error("Queue error")
      })

      const ticketCleanup = cronCallbacks.get("*/30 * * * *")

      await expect(ticketCleanup!()).resolves.not.toThrow()
    })
  })
})

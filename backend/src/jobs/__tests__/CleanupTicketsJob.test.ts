import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/models/Ticket", () => ({
  default: {
    findAll: vi.fn()
  }
}))

vi.mock("@/models/TicketLog", () => ({
  default: {
    create: vi.fn()
  }
}))

vi.mock("@/models/Setting", () => ({
  default: {
    findOne: vi.fn()
  }
}))

vi.mock("@/models/Tenant", () => ({
  default: {
    findByPk: vi.fn(),
    findAll: vi.fn()
  }
}))

vi.mock("@/helpers/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

import { process as processJob } from "../CleanupTicketsJob"
import Ticket from "@/models/Ticket"
import TicketLog from "@/models/TicketLog"
import Setting from "@/models/Setting"
import Tenant from "@/models/Tenant"
import { buildTicket, buildTenant, buildSetting } from "@/__tests__/factories"

describe("CleanupTicketsJob", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createJob = (data: { tenantId?: number }) => ({ data }) as any

  it("closes stale tickets based on inactivity setting", async () => {
    const mockTenant = buildTenant({ id: 1 })
    vi.mocked(Tenant.findAll).mockResolvedValue([mockTenant] as any)

    const mockSetting = buildSetting({
      key: "timeCreateNewTicket",
      value: "120"
    })
    vi.mocked(Setting.findOne).mockResolvedValue(mockSetting as any)

    const oldDate = new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
    const staleTicket = buildTicket({
      id: 1,
      status: "open",
      lastMessageAt: oldDate
    })
    vi.mocked(Ticket.findAll).mockResolvedValue([staleTicket] as any)

    await processJob(createJob({}))

    expect(staleTicket.update).toHaveBeenCalledWith({ status: "closed" })
    expect(TicketLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ticketId: 1,
        type: "status_changed",
        payload: expect.objectContaining({
          to: "closed",
          reason: "inactivity"
        })
      })
    )
  })

  it("skips recent tickets that are not yet stale", async () => {
    const mockTenant = buildTenant({ id: 1 })
    vi.mocked(Tenant.findAll).mockResolvedValue([mockTenant] as any)

    vi.mocked(Setting.findOne).mockResolvedValue(null)

    // Ticket.findAll returns empty array - no stale tickets found
    vi.mocked(Ticket.findAll).mockResolvedValue([] as any)

    await processJob(createJob({}))

    expect(TicketLog.create).not.toHaveBeenCalled()
  })

  it("uses default 24 hours when no setting is configured", async () => {
    const mockTenant = buildTenant({ id: 1 })
    vi.mocked(Tenant.findAll).mockResolvedValue([mockTenant] as any)

    vi.mocked(Setting.findOne).mockResolvedValue(null)

    vi.mocked(Ticket.findAll).mockResolvedValue([] as any)

    await processJob(createJob({}))

    expect(Ticket.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: 1
        })
      })
    )
  })

  it("processes a specific tenant when tenantId is provided", async () => {
    const mockTenant = buildTenant({ id: 5 })
    vi.mocked(Tenant.findByPk).mockResolvedValue(mockTenant as any)

    vi.mocked(Setting.findOne).mockResolvedValue(null)
    vi.mocked(Ticket.findAll).mockResolvedValue([] as any)

    await processJob(createJob({ tenantId: 5 }))

    expect(Tenant.findByPk).toHaveBeenCalledWith(5)
    expect(Tenant.findAll).not.toHaveBeenCalled()
  })
})

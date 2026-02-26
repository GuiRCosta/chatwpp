import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/models/Campaign", () => ({
  default: {
    findByPk: vi.fn()
  }
}))

vi.mock("@/models/CampaignContact", () => ({
  default: {
    findAll: vi.fn()
  }
}))

vi.mock("@/models/Contact", () => ({
  default: {}
}))

vi.mock("@/models/WhatsApp", () => ({
  default: {
    findByPk: vi.fn()
  }
}))

vi.mock("@/libs/waba/wabaClient", () => ({
  sendTextMessage: vi.fn(),
  sendMediaMessage: vi.fn()
}))

vi.mock("@/helpers/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

import { process as processJob } from "../CampaignJob"
import Campaign from "@/models/Campaign"
import CampaignContact from "@/models/CampaignContact"
import WhatsApp from "@/models/WhatsApp"
import { sendTextMessage } from "@/libs/waba/wabaClient"
import { buildCampaign, buildWhatsApp, buildContact } from "@/__tests__/factories"

describe("CampaignJob", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Override setTimeout to make delays instant
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const createJob = (data: { campaignId: number; tenantId: number }) =>
    ({ data }) as any

  it("processes a campaign and sends messages to all pending contacts", async () => {
    const mockCampaign = buildCampaign({
      id: 1,
      whatsappId: 1,
      message: "Hello {{name}}",
      status: "pending",
      mediaUrl: ""
    })
    vi.mocked(Campaign.findByPk).mockResolvedValue(mockCampaign as any)

    const mockWhatsApp = buildWhatsApp({
      id: 1,
      wabaPhoneNumberId: "phone-123",
      wabaToken: "token-abc"
    })
    vi.mocked(WhatsApp.findByPk).mockResolvedValue(mockWhatsApp as any)

    const contact1 = buildContact({ id: 10, number: "5511111111111" })
    const contact2 = buildContact({ id: 20, number: "5511222222222" })

    const campaignContact1 = {
      id: 1,
      contactId: 10,
      status: "pending",
      contact: contact1,
      update: vi.fn().mockResolvedValue(undefined)
    }
    const campaignContact2 = {
      id: 2,
      contactId: 20,
      status: "pending",
      contact: contact2,
      update: vi.fn().mockResolvedValue(undefined)
    }

    vi.mocked(CampaignContact.findAll).mockResolvedValue([
      campaignContact1,
      campaignContact2
    ] as any)

    vi.mocked(sendTextMessage).mockResolvedValue({ messages: [{ id: "wamid.1" }] } as any)

    const processPromise = processJob(createJob({ campaignId: 1, tenantId: 1 }))

    // Advance timers to handle the delays between messages
    await vi.advanceTimersByTimeAsync(5000)

    await processPromise

    expect(mockCampaign.update).toHaveBeenCalledWith({ status: "processing" })
    expect(sendTextMessage).toHaveBeenCalledTimes(2)
    expect(campaignContact1.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "sent" })
    )
    expect(campaignContact2.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "sent" })
    )
    expect(mockCampaign.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "completed" })
    )
  })

  it("returns early when campaign is not found", async () => {
    vi.mocked(Campaign.findByPk).mockResolvedValue(null)

    await processJob(createJob({ campaignId: 999, tenantId: 1 }))

    expect(sendTextMessage).not.toHaveBeenCalled()
  })

  it("returns early when campaign is already cancelled", async () => {
    const mockCampaign = buildCampaign({ id: 1, status: "cancelled" })
    vi.mocked(Campaign.findByPk).mockResolvedValue(mockCampaign as any)

    await processJob(createJob({ campaignId: 1, tenantId: 1 }))

    expect(mockCampaign.update).not.toHaveBeenCalled()
    expect(sendTextMessage).not.toHaveBeenCalled()
  })

  it("cancels campaign when WhatsApp has no valid credentials", async () => {
    const mockCampaign = buildCampaign({ id: 1, status: "pending", whatsappId: 1 })
    vi.mocked(Campaign.findByPk).mockResolvedValue(mockCampaign as any)

    const mockWhatsApp = buildWhatsApp({
      id: 1,
      wabaPhoneNumberId: null,
      wabaToken: null
    })
    vi.mocked(WhatsApp.findByPk).mockResolvedValue(mockWhatsApp as any)

    await processJob(createJob({ campaignId: 1, tenantId: 1 }))

    expect(mockCampaign.update).toHaveBeenCalledWith({ status: "processing" })
    expect(mockCampaign.update).toHaveBeenCalledWith({ status: "cancelled" })
    expect(sendTextMessage).not.toHaveBeenCalled()
  })
})

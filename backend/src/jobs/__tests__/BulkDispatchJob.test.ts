import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

vi.mock("@/models/BulkDispatch", () => ({
  default: {
    findByPk: vi.fn()
  }
}))

vi.mock("@/models/WhatsApp", () => ({
  default: {
    findByPk: vi.fn()
  }
}))

vi.mock("@/models/Contact", () => ({
  default: {
    findByPk: vi.fn()
  }
}))

vi.mock("@/libs/waba/wabaClient", () => ({
  sendTextMessage: vi.fn()
}))

vi.mock("@/libs/socket", () => ({
  emitToTenant: vi.fn()
}))

vi.mock("@/helpers/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

import { process as processJob } from "../BulkDispatchJob"
import BulkDispatch from "@/models/BulkDispatch"
import WhatsApp from "@/models/WhatsApp"
import Contact from "@/models/Contact"
import { sendTextMessage } from "@/libs/waba/wabaClient"
import { emitToTenant } from "@/libs/socket"
import { buildWhatsApp, buildContact } from "@/__tests__/factories"

describe("BulkDispatchJob", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const createJob = (data: {
    bulkDispatchId: number
    tenantId: number
    message: string
    contactIds: number[]
  }) => ({ data }) as any

  function buildDispatch(overrides: Record<string, unknown> = {}) {
    const data = {
      id: 1,
      tenantId: 1,
      whatsappId: 1,
      message: "Hello!",
      status: "pending",
      totalMessages: 0,
      sentMessages: 0,
      errorMessages: 0,
      ...overrides
    }
    return {
      ...data,
      update: vi.fn().mockResolvedValue(undefined)
    }
  }

  it("processes a bulk dispatch and sends messages to all contacts", async () => {
    const mockDispatch = buildDispatch({ id: 1, whatsappId: 1 })
    vi.mocked(BulkDispatch.findByPk).mockResolvedValue(mockDispatch as any)

    const mockWhatsApp = buildWhatsApp({
      id: 1,
      wabaPhoneNumberId: "phone-123",
      wabaToken: "token-abc"
    })
    vi.mocked(WhatsApp.findByPk).mockResolvedValue(mockWhatsApp as any)

    const contact1 = buildContact({ id: 10, number: "5511111111111" })
    const contact2 = buildContact({ id: 20, number: "5522222222222" })
    vi.mocked(Contact.findByPk)
      .mockResolvedValueOnce(contact1 as any)
      .mockResolvedValueOnce(contact2 as any)

    vi.mocked(sendTextMessage).mockResolvedValue({ messages: [{ id: "wamid.1" }] } as any)

    const processPromise = processJob(createJob({
      bulkDispatchId: 1,
      tenantId: 1,
      message: "Hello everyone!",
      contactIds: [10, 20]
    }))

    await vi.advanceTimersByTimeAsync(5000)
    await processPromise

    expect(mockDispatch.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "processing" })
    )
    expect(sendTextMessage).toHaveBeenCalledTimes(2)
    expect(sendTextMessage).toHaveBeenCalledWith(
      "phone-123", "token-abc", "5511111111111", "Hello everyone!"
    )
    expect(sendTextMessage).toHaveBeenCalledWith(
      "phone-123", "token-abc", "5522222222222", "Hello everyone!"
    )
    expect(mockDispatch.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "completed", sentMessages: 2, errorMessages: 0 })
    )
    expect(emitToTenant).toHaveBeenCalledWith(1, "bulkDispatch:updated", mockDispatch)
  })

  it("returns early when dispatch is not found", async () => {
    vi.mocked(BulkDispatch.findByPk).mockResolvedValue(null)

    await processJob(createJob({
      bulkDispatchId: 999,
      tenantId: 1,
      message: "Hello!",
      contactIds: [1]
    }))

    expect(sendTextMessage).not.toHaveBeenCalled()
    expect(emitToTenant).not.toHaveBeenCalled()
  })

  it("cancels dispatch when WhatsApp has no valid credentials", async () => {
    const mockDispatch = buildDispatch({ id: 1, whatsappId: 1 })
    vi.mocked(BulkDispatch.findByPk).mockResolvedValue(mockDispatch as any)

    const mockWhatsApp = buildWhatsApp({
      id: 1,
      wabaPhoneNumberId: null,
      wabaToken: null
    })
    vi.mocked(WhatsApp.findByPk).mockResolvedValue(mockWhatsApp as any)

    await processJob(createJob({
      bulkDispatchId: 1,
      tenantId: 1,
      message: "Hello!",
      contactIds: [1]
    }))

    expect(mockDispatch.update).toHaveBeenCalledWith({ status: "cancelled" })
    expect(sendTextMessage).not.toHaveBeenCalled()
  })

  it("cancels dispatch when WhatsApp is not found", async () => {
    const mockDispatch = buildDispatch({ id: 1, whatsappId: 1 })
    vi.mocked(BulkDispatch.findByPk).mockResolvedValue(mockDispatch as any)

    vi.mocked(WhatsApp.findByPk).mockResolvedValue(null)

    await processJob(createJob({
      bulkDispatchId: 1,
      tenantId: 1,
      message: "Hello!",
      contactIds: [1]
    }))

    expect(mockDispatch.update).toHaveBeenCalledWith({ status: "cancelled" })
    expect(sendTextMessage).not.toHaveBeenCalled()
  })

  it("skips contacts without valid number", async () => {
    const mockDispatch = buildDispatch({ id: 1, whatsappId: 1 })
    vi.mocked(BulkDispatch.findByPk).mockResolvedValue(mockDispatch as any)

    const mockWhatsApp = buildWhatsApp({
      id: 1,
      wabaPhoneNumberId: "phone-123",
      wabaToken: "token-abc"
    })
    vi.mocked(WhatsApp.findByPk).mockResolvedValue(mockWhatsApp as any)

    const validContact = buildContact({ id: 10, number: "5511111111111" })
    const noNumberContact = buildContact({ id: 20, number: null })

    vi.mocked(Contact.findByPk)
      .mockResolvedValueOnce(validContact as any)
      .mockResolvedValueOnce(noNumberContact as any)

    vi.mocked(sendTextMessage).mockResolvedValue({ messages: [{ id: "wamid.1" }] } as any)

    const processPromise = processJob(createJob({
      bulkDispatchId: 1,
      tenantId: 1,
      message: "Hello!",
      contactIds: [10, 20]
    }))

    await vi.advanceTimersByTimeAsync(5000)
    await processPromise

    expect(sendTextMessage).toHaveBeenCalledTimes(1)
    expect(mockDispatch.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "completed", sentMessages: 1, errorMessages: 1 })
    )
  })

  it("skips contacts that are not found", async () => {
    const mockDispatch = buildDispatch({ id: 1, whatsappId: 1 })
    vi.mocked(BulkDispatch.findByPk).mockResolvedValue(mockDispatch as any)

    const mockWhatsApp = buildWhatsApp({
      id: 1,
      wabaPhoneNumberId: "phone-123",
      wabaToken: "token-abc"
    })
    vi.mocked(WhatsApp.findByPk).mockResolvedValue(mockWhatsApp as any)

    vi.mocked(Contact.findByPk).mockResolvedValue(null)

    await processJob(createJob({
      bulkDispatchId: 1,
      tenantId: 1,
      message: "Hello!",
      contactIds: [999]
    }))

    expect(sendTextMessage).not.toHaveBeenCalled()
    expect(mockDispatch.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "completed", sentMessages: 0, errorMessages: 1 })
    )
  })

  it("counts errors when sendTextMessage fails", async () => {
    const mockDispatch = buildDispatch({ id: 1, whatsappId: 1 })
    vi.mocked(BulkDispatch.findByPk).mockResolvedValue(mockDispatch as any)

    const mockWhatsApp = buildWhatsApp({
      id: 1,
      wabaPhoneNumberId: "phone-123",
      wabaToken: "token-abc"
    })
    vi.mocked(WhatsApp.findByPk).mockResolvedValue(mockWhatsApp as any)

    const contact = buildContact({ id: 10, number: "5511111111111" })
    vi.mocked(Contact.findByPk).mockResolvedValue(contact as any)

    vi.mocked(sendTextMessage).mockRejectedValue(new Error("API error"))

    await processJob(createJob({
      bulkDispatchId: 1,
      tenantId: 1,
      message: "Hello!",
      contactIds: [10]
    }))

    expect(mockDispatch.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "completed", sentMessages: 0, errorMessages: 1 })
    )
  })
})

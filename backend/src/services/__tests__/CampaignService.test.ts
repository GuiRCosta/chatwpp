import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/models/Campaign", () => ({
  default: {
    findOne: vi.fn(),
    findByPk: vi.fn(),
    findAndCountAll: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn()
  }
}))

vi.mock("@/models/CampaignContact", () => ({
  default: {
    findOne: vi.fn(),
    findAll: vi.fn(),
    findAndCountAll: vi.fn(),
    bulkCreate: vi.fn(),
    count: vi.fn(),
    destroy: vi.fn()
  }
}))

vi.mock("@/models/Contact", () => ({
  default: {
    findAll: vi.fn()
  }
}))

vi.mock("@/models/WhatsApp", () => ({
  default: {
    findOne: vi.fn()
  }
}))

vi.mock("@/libs/queues", () => ({
  getQueue: vi.fn()
}))

vi.mock("@/jobs/CampaignJob", () => ({
  QUEUE_NAME: "campaign"
}))

import {
  listCampaigns,
  findCampaignById,
  createCampaign,
  updateCampaign,
  startCampaign,
  cancelCampaign,
  addContactsToCampaign
} from "../CampaignService"
import Campaign from "@/models/Campaign"
import CampaignContact from "@/models/CampaignContact"
import Contact from "@/models/Contact"
import WhatsApp from "@/models/WhatsApp"
import { getQueue } from "@/libs/queues"
import { buildCampaign, buildWhatsApp, buildContact } from "@/__tests__/factories"
import { AppError } from "@/helpers/AppError"

describe("CampaignService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listCampaigns", () => {
    it("returns paginated campaigns", async () => {
      const mockCampaigns = [
        buildCampaign({ id: 1, name: "Campaign A" }),
        buildCampaign({ id: 2, name: "Campaign B" })
      ]
      vi.mocked(Campaign.findAndCountAll).mockResolvedValue({
        rows: mockCampaigns,
        count: 2
      } as any)

      const result = await listCampaigns({ tenantId: 1 })

      expect(result.campaigns).toHaveLength(2)
      expect(result.count).toBe(2)
      expect(result.hasMore).toBe(false)
    })
  })

  describe("findCampaignById", () => {
    it("returns a campaign with contact counts", async () => {
      const mockCampaign = buildCampaign({ id: 5 })
      vi.mocked(Campaign.findOne).mockResolvedValue(mockCampaign as unknown as Campaign)

      vi.mocked(CampaignContact.findAll).mockResolvedValue([
        { status: "pending", count: 10 },
        { status: "sent", count: 5 }
      ] as any)

      const result = await findCampaignById(5, 1)

      expect(result).toBeDefined()
      expect(Campaign.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 5, tenantId: 1 }
        })
      )
    })

    it("throws AppError when campaign is not found", async () => {
      vi.mocked(Campaign.findOne).mockResolvedValue(null)

      await expect(findCampaignById(999, 1)).rejects.toThrow(AppError)
      await expect(findCampaignById(999, 1)).rejects.toThrow("Campaign not found")
    })
  })

  describe("createCampaign", () => {
    it("creates a campaign successfully", async () => {
      const mockWhatsApp = buildWhatsApp({ id: 1 })
      vi.mocked(WhatsApp.findOne).mockResolvedValue(mockWhatsApp as unknown as WhatsApp)

      const createdCampaign = buildCampaign({ id: 10, name: "New Campaign" })
      vi.mocked(Campaign.create).mockResolvedValue(createdCampaign as unknown as Campaign)

      // findCampaignById internal call
      vi.mocked(Campaign.findOne).mockResolvedValue(createdCampaign as unknown as Campaign)
      vi.mocked(CampaignContact.findAll).mockResolvedValue([] as any)

      const result = await createCampaign(1, {
        name: "New Campaign",
        message: "Hello {{name}}",
        whatsappId: 1
      })

      expect(result).toBeDefined()
      expect(Campaign.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          name: "New Campaign",
          message: "Hello {{name}}",
          whatsappId: 1,
          status: "pending"
        })
      )
    })

    it("throws error when WhatsApp connection is not found", async () => {
      vi.mocked(WhatsApp.findOne).mockResolvedValue(null)

      await expect(
        createCampaign(1, {
          name: "Bad Campaign",
          message: "Hello",
          whatsappId: 999
        })
      ).rejects.toThrow("WhatsApp connection not found")
    })
  })

  describe("updateCampaign", () => {
    it("updates a pending campaign successfully", async () => {
      const mockCampaign = buildCampaign({ id: 1, status: "pending" })
      vi.mocked(Campaign.findOne)
        .mockResolvedValueOnce(mockCampaign as unknown as Campaign) // initial find
        .mockResolvedValueOnce(mockCampaign as unknown as Campaign) // findCampaignById

      vi.mocked(CampaignContact.findAll).mockResolvedValue([] as any)

      const result = await updateCampaign(1, 1, { name: "Updated Campaign" })

      expect(result).toBeDefined()
      expect(mockCampaign.update).toHaveBeenCalledWith({ name: "Updated Campaign" })
    })

    it("throws error when campaign is not pending", async () => {
      const mockCampaign = buildCampaign({ id: 1, status: "processing" })
      vi.mocked(Campaign.findOne).mockResolvedValue(mockCampaign as unknown as Campaign)

      await expect(
        updateCampaign(1, 1, { name: "Updated" })
      ).rejects.toThrow("Only pending campaigns can be updated")
    })
  })

  describe("startCampaign", () => {
    it("starts a pending campaign with contacts", async () => {
      const mockCampaign = buildCampaign({ id: 1, status: "pending" })
      vi.mocked(Campaign.findOne).mockResolvedValue(mockCampaign as unknown as Campaign)
      vi.mocked(CampaignContact.count).mockResolvedValue(10)

      const mockQueue = { add: vi.fn().mockResolvedValue(undefined) }
      vi.mocked(getQueue).mockReturnValue(mockQueue as any)

      const result = await startCampaign(1, 1)

      expect(result).toBeDefined()
      expect(getQueue).toHaveBeenCalledWith("campaign")
      expect(mockQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({ campaignId: 1, tenantId: 1 })
      )
    })

    it("throws error when campaign has no contacts", async () => {
      const mockCampaign = buildCampaign({ id: 1, status: "pending" })
      vi.mocked(Campaign.findOne).mockResolvedValue(mockCampaign as unknown as Campaign)
      vi.mocked(CampaignContact.count).mockResolvedValue(0)

      await expect(startCampaign(1, 1)).rejects.toThrow(
        "Campaign has no contacts"
      )
    })

    it("throws error when campaign is not pending", async () => {
      const mockCampaign = buildCampaign({ id: 1, status: "completed" })
      vi.mocked(Campaign.findOne).mockResolvedValue(mockCampaign as unknown as Campaign)

      await expect(startCampaign(1, 1)).rejects.toThrow(
        "Only pending campaigns can be started"
      )
    })
  })

  describe("cancelCampaign", () => {
    it("cancels a pending campaign", async () => {
      const mockCampaign = buildCampaign({ id: 1, status: "pending" })
      vi.mocked(Campaign.findOne)
        .mockResolvedValueOnce(mockCampaign as unknown as Campaign) // initial find
        .mockResolvedValueOnce(mockCampaign as unknown as Campaign) // findCampaignById

      vi.mocked(CampaignContact.findAll).mockResolvedValue([] as any)

      const result = await cancelCampaign(1, 1)

      expect(result).toBeDefined()
      expect(mockCampaign.update).toHaveBeenCalledWith({ status: "cancelled" })
    })

    it("throws error when campaign is completed", async () => {
      const mockCampaign = buildCampaign({ id: 1, status: "completed" })
      vi.mocked(Campaign.findOne).mockResolvedValue(mockCampaign as unknown as Campaign)

      await expect(cancelCampaign(1, 1)).rejects.toThrow(
        "Completed campaigns cannot be cancelled"
      )
    })

    it("throws error when campaign is already cancelled", async () => {
      const mockCampaign = buildCampaign({ id: 1, status: "cancelled" })
      vi.mocked(Campaign.findOne).mockResolvedValue(mockCampaign as unknown as Campaign)

      await expect(cancelCampaign(1, 1)).rejects.toThrow(
        "Campaign is already cancelled"
      )
    })
  })

  describe("addContactsToCampaign", () => {
    it("adds contacts to a pending campaign", async () => {
      const mockCampaign = buildCampaign({ id: 1, status: "pending" })
      vi.mocked(Campaign.findOne).mockResolvedValue(mockCampaign as unknown as Campaign)

      const mockContacts = [
        buildContact({ id: 10 }),
        buildContact({ id: 20 })
      ]
      vi.mocked(Contact.findAll).mockResolvedValue(mockContacts as any)

      vi.mocked(CampaignContact.findAll).mockResolvedValue([] as any)

      await addContactsToCampaign(1, 1, [10, 20])

      expect(CampaignContact.bulkCreate).toHaveBeenCalledWith([
        { campaignId: 1, contactId: 10, status: "pending" },
        { campaignId: 1, contactId: 20, status: "pending" }
      ])
    })

    it("skips already added contacts", async () => {
      const mockCampaign = buildCampaign({ id: 1, status: "pending" })
      vi.mocked(Campaign.findOne).mockResolvedValue(mockCampaign as unknown as Campaign)

      const mockContacts = [
        buildContact({ id: 10 }),
        buildContact({ id: 20 })
      ]
      vi.mocked(Contact.findAll).mockResolvedValue(mockContacts as any)

      vi.mocked(CampaignContact.findAll).mockResolvedValue([
        { contactId: 10 }
      ] as any)

      await addContactsToCampaign(1, 1, [10, 20])

      expect(CampaignContact.bulkCreate).toHaveBeenCalledWith([
        { campaignId: 1, contactId: 20, status: "pending" }
      ])
    })

    it("throws error when some contacts are not found", async () => {
      const mockCampaign = buildCampaign({ id: 1, status: "pending" })
      vi.mocked(Campaign.findOne).mockResolvedValue(mockCampaign as unknown as Campaign)

      vi.mocked(Contact.findAll).mockResolvedValue([
        buildContact({ id: 10 })
      ] as any)

      await expect(
        addContactsToCampaign(1, 1, [10, 20, 30])
      ).rejects.toThrow("One or more contacts not found")
    })
  })
})

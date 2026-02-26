import { describe, it, expect, vi, beforeEach } from "vitest"
import request from "supertest"
import { createTestToken } from "@/__tests__/helpers"

// --- Infrastructure mocks (prevent DB/Redis connections) ---
vi.mock("@/libs/bullBoard", () => ({
  setupBullBoard: vi.fn().mockReturnValue({
    getRouter: () => (_req: unknown, _res: unknown, next: () => void) => next()
  })
}))

// --- Webhook mocks (WebhookController imports these which import models) ---
vi.mock("@/libs/waba/webhookHandler", () => ({ verifyWebhook: vi.fn(), processWebhook: vi.fn() }))
vi.mock("@/libs/waba/webhookSignature", () => ({ verifySignature: vi.fn() }))

// --- Mock ALL services ---
vi.mock("@/services/AuthService", () => ({ login: vi.fn(), refreshTokens: vi.fn(), logout: vi.fn(), hashPassword: vi.fn() }))
vi.mock("@/services/TicketService", () => ({ listTickets: vi.fn(), findTicketById: vi.fn(), createTicket: vi.fn(), updateTicket: vi.fn(), deleteTicket: vi.fn() }))
vi.mock("@/services/ContactService", () => ({ listContacts: vi.fn(), findContactById: vi.fn(), findContactByNumber: vi.fn(), createContact: vi.fn(), updateContact: vi.fn(), deleteContact: vi.fn() }))
vi.mock("@/services/UserService", () => ({ listUsers: vi.fn(), findUserById: vi.fn(), createUser: vi.fn(), updateUser: vi.fn(), deleteUser: vi.fn() }))
vi.mock("@/services/MessageService", () => ({ listMessages: vi.fn(), createMessage: vi.fn(), markMessagesAsRead: vi.fn() }))
vi.mock("@/services/CampaignService", () => ({ listCampaigns: vi.fn(), findCampaignById: vi.fn(), createCampaign: vi.fn(), updateCampaign: vi.fn(), startCampaign: vi.fn(), cancelCampaign: vi.fn(), addContactsToCampaign: vi.fn(), removeContactFromCampaign: vi.fn() }))
vi.mock("@/services/SettingService", () => ({ getSettings: vi.fn(), getSettingByKey: vi.fn(), updateSetting: vi.fn(), updateSettingsBulk: vi.fn() }))
vi.mock("@/services/TenantService", () => ({ listTenants: vi.fn(), findTenantById: vi.fn(), createTenant: vi.fn(), updateTenant: vi.fn(), deleteTenant: vi.fn() }))
vi.mock("@/services/QueueService", () => ({ listQueues: vi.fn(), findQueueById: vi.fn(), createQueue: vi.fn(), updateQueue: vi.fn(), deleteQueue: vi.fn() }))
vi.mock("@/services/TagService", () => ({ listTags: vi.fn(), findTagById: vi.fn(), createTag: vi.fn(), updateTag: vi.fn(), deleteTag: vi.fn() }))
vi.mock("@/services/WhatsAppService", () => ({ listWhatsApps: vi.fn(), findWhatsAppById: vi.fn(), createWhatsApp: vi.fn(), updateWhatsApp: vi.fn(), deleteWhatsApp: vi.fn(), requestQRCode: vi.fn(), disconnectSession: vi.fn() }))
vi.mock("@/services/FastReplyService", () => ({ listFastReplies: vi.fn(), findFastReplyById: vi.fn(), createFastReply: vi.fn(), updateFastReply: vi.fn(), deleteFastReply: vi.fn() }))
vi.mock("@/services/GalleryService", () => ({ listGalleries: vi.fn(), findGalleryById: vi.fn(), createGallery: vi.fn(), updateGallery: vi.fn(), deleteGallery: vi.fn() }))
vi.mock("@/services/BanListService", () => ({ listBanList: vi.fn(), findBanListById: vi.fn(), createBanList: vi.fn(), updateBanList: vi.fn(), deleteBanList: vi.fn() }))
vi.mock("@/services/NotificationService", () => ({ listNotifications: vi.fn(), findNotificationById: vi.fn(), createNotification: vi.fn(), markAsRead: vi.fn(), deleteNotification: vi.fn() }))
vi.mock("@/services/TodoListService", () => ({ listTodoLists: vi.fn(), findTodoListById: vi.fn(), createTodoList: vi.fn(), updateTodoList: vi.fn(), deleteTodoList: vi.fn() }))
vi.mock("@/services/CallLogService", () => ({ listCallLogs: vi.fn(), findCallLogById: vi.fn(), createCallLog: vi.fn(), updateCallLog: vi.fn(), deleteCallLog: vi.fn() }))
vi.mock("@/services/PipelineService", () => ({ listPipelines: vi.fn(), findPipelineById: vi.fn(), createPipeline: vi.fn(), updatePipeline: vi.fn(), deletePipeline: vi.fn() }))
vi.mock("@/services/KanbanService", () => ({ listKanbans: vi.fn(), findKanbanById: vi.fn(), createKanban: vi.fn(), updateKanban: vi.fn(), deleteKanban: vi.fn() }))
vi.mock("@/services/OpportunityService", () => ({ listOpportunities: vi.fn(), findOpportunityById: vi.fn(), createOpportunity: vi.fn(), updateOpportunity: vi.fn(), deleteOpportunity: vi.fn() }))
vi.mock("@/services/AutoReplyService", () => ({ listAutoReplies: vi.fn(), findAutoReplyById: vi.fn(), createAutoReply: vi.fn(), updateAutoReply: vi.fn(), deleteAutoReply: vi.fn() }))
vi.mock("@/services/ChatFlowService", () => ({ listChatFlows: vi.fn(), findChatFlowById: vi.fn(), createChatFlow: vi.fn(), updateChatFlow: vi.fn(), deleteChatFlow: vi.fn() }))

import { app } from "@/__tests__/helpers/testApp"
import * as CampaignService from "@/services/CampaignService"
import { AppError } from "@/helpers/AppError"

describe("CampaignController Integration", () => {
  const token = createTestToken()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("GET /campaigns", () => {
    it("returns 200 with list of campaigns", async () => {
      const mockCampaigns = [
        { id: 1, name: "Campaign 1", status: "pending" },
        { id: 2, name: "Campaign 2", status: "completed" }
      ]
      vi.mocked(CampaignService.listCampaigns).mockResolvedValue({
        campaigns: mockCampaigns as never,
        count: 2,
        hasMore: false
      })

      const response = await request(app)
        .get("/campaigns")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockCampaigns)
      expect(response.body.meta).toEqual({
        total: 2,
        page: 1,
        limit: 20,
        hasMore: false
      })
      expect(CampaignService.listCampaigns).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          pageNumber: "1",
          limit: "20"
        })
      )
    })

    it("returns 401 without auth token", async () => {
      const response = await request(app).get("/campaigns")

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
    })
  })

  describe("GET /campaigns/:id", () => {
    it("returns 200 with campaign details", async () => {
      const mockCampaign = { id: 1, name: "Campaign 1", status: "pending" }
      vi.mocked(CampaignService.findCampaignById).mockResolvedValue(mockCampaign as never)

      const response = await request(app)
        .get("/campaigns/1")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockCampaign)
      expect(CampaignService.findCampaignById).toHaveBeenCalledWith(1, 1)
    })
  })

  describe("POST /campaigns", () => {
    it("returns 201 with created campaign", async () => {
      const mockCampaign = { id: 3, name: "New Campaign", status: "pending" }
      vi.mocked(CampaignService.createCampaign).mockResolvedValue(mockCampaign as never)

      const response = await request(app)
        .post("/campaigns")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "New Campaign", message: "Hello everyone!", whatsappId: 1 })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockCampaign)
      expect(CampaignService.createCampaign).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          name: "New Campaign",
          message: "Hello everyone!",
          whatsappId: 1
        })
      )
    })

    it("returns error when required fields are missing", async () => {
      const response = await request(app)
        .post("/campaigns")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Incomplete Campaign" })

      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(CampaignService.createCampaign).not.toHaveBeenCalled()
    })
  })

  describe("PUT /campaigns/:id", () => {
    it("returns 200 with updated campaign", async () => {
      const mockCampaign = { id: 1, name: "Updated Campaign", status: "pending" }
      vi.mocked(CampaignService.updateCampaign).mockResolvedValue(mockCampaign as never)

      const response = await request(app)
        .put("/campaigns/1")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Campaign" })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockCampaign)
      expect(CampaignService.updateCampaign).toHaveBeenCalledWith(
        1,
        1,
        expect.objectContaining({ name: "Updated Campaign" })
      )
    })
  })

  describe("POST /campaigns/:id/start", () => {
    it("returns 200 on successful campaign start", async () => {
      const mockCampaign = { id: 1, name: "Campaign 1", status: "running" }
      vi.mocked(CampaignService.startCampaign).mockResolvedValue(mockCampaign as never)

      const response = await request(app)
        .post("/campaigns/1/start")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockCampaign)
      expect(CampaignService.startCampaign).toHaveBeenCalledWith(1, 1)
    })

    it("returns error when campaign cannot be started", async () => {
      vi.mocked(CampaignService.startCampaign).mockRejectedValue(
        new AppError("Only pending campaigns can be started", 400)
      )

      const response = await request(app)
        .post("/campaigns/1/start")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe("Only pending campaigns can be started")
    })
  })

  describe("POST /campaigns/:id/cancel", () => {
    it("returns 200 on successful campaign cancellation", async () => {
      const mockCampaign = { id: 1, name: "Campaign 1", status: "cancelled" }
      vi.mocked(CampaignService.cancelCampaign).mockResolvedValue(mockCampaign as never)

      const response = await request(app)
        .post("/campaigns/1/cancel")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockCampaign)
      expect(CampaignService.cancelCampaign).toHaveBeenCalledWith(1, 1)
    })

    it("returns error when campaign is already completed", async () => {
      vi.mocked(CampaignService.cancelCampaign).mockRejectedValue(
        new AppError("Completed campaigns cannot be cancelled", 400)
      )

      const response = await request(app)
        .post("/campaigns/1/cancel")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe("Completed campaigns cannot be cancelled")
    })
  })

  describe("POST /campaigns/:id/contacts", () => {
    it("returns 200 when contacts are added", async () => {
      vi.mocked(CampaignService.addContactsToCampaign).mockResolvedValue(undefined)

      const response = await request(app)
        .post("/campaigns/1/contacts")
        .set("Authorization", `Bearer ${token}`)
        .send({ contactIds: [1, 2, 3] })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.message).toBe("Contacts added to campaign successfully")
      expect(CampaignService.addContactsToCampaign).toHaveBeenCalledWith(1, 1, [1, 2, 3])
    })
  })

  describe("DELETE /campaigns/:id/contacts/:contactId", () => {
    it("returns 200 when contact is removed from campaign", async () => {
      vi.mocked(CampaignService.removeContactFromCampaign).mockResolvedValue(undefined)

      const response = await request(app)
        .delete("/campaigns/1/contacts/5")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.message).toBe("Contact removed from campaign successfully")
      expect(CampaignService.removeContactFromCampaign).toHaveBeenCalledWith(1, 5, 1)
    })
  })
})

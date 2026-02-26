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
vi.mock("@/services/BanListService", () => ({ listBanList: vi.fn(), listBanLists: vi.fn(), findBanListById: vi.fn(), createBanList: vi.fn(), updateBanList: vi.fn(), deleteBanList: vi.fn() }))
vi.mock("@/services/NotificationService", () => ({ listNotifications: vi.fn(), findNotificationById: vi.fn(), createNotification: vi.fn(), markAsRead: vi.fn(), markAllAsRead: vi.fn(), deleteNotification: vi.fn() }))
vi.mock("@/services/TodoListService", () => ({ listTodoLists: vi.fn(), findTodoListById: vi.fn(), createTodoList: vi.fn(), updateTodoList: vi.fn(), toggleTodoList: vi.fn(), deleteTodoList: vi.fn() }))
vi.mock("@/services/CallLogService", () => ({ listCallLogs: vi.fn(), findCallLogById: vi.fn(), createCallLog: vi.fn(), updateCallLog: vi.fn(), deleteCallLog: vi.fn() }))
vi.mock("@/services/PipelineService", () => ({ listPipelines: vi.fn(), findPipelineById: vi.fn(), createPipeline: vi.fn(), updatePipeline: vi.fn(), deletePipeline: vi.fn() }))
vi.mock("@/services/KanbanService", () => ({ listKanbans: vi.fn(), findKanbanById: vi.fn(), createKanban: vi.fn(), updateKanban: vi.fn(), deleteKanban: vi.fn(), createStage: vi.fn(), updateStage: vi.fn(), deleteStage: vi.fn(), reorderStages: vi.fn() }))
vi.mock("@/services/OpportunityService", () => ({ listOpportunities: vi.fn(), findOpportunityById: vi.fn(), createOpportunity: vi.fn(), updateOpportunity: vi.fn(), moveOpportunity: vi.fn(), deleteOpportunity: vi.fn() }))
vi.mock("@/services/AutoReplyService", () => ({ listAutoReplies: vi.fn(), findAutoReplyById: vi.fn(), createAutoReply: vi.fn(), updateAutoReply: vi.fn(), deleteAutoReply: vi.fn(), createStep: vi.fn(), updateStep: vi.fn(), deleteStep: vi.fn() }))
vi.mock("@/services/ChatFlowService", () => ({ listChatFlows: vi.fn(), findChatFlowById: vi.fn(), createChatFlow: vi.fn(), updateChatFlow: vi.fn(), deleteChatFlow: vi.fn(), duplicateChatFlow: vi.fn() }))

import { app } from "@/__tests__/helpers/testApp"
import * as OpportunityService from "@/services/OpportunityService"
import { AppError } from "@/helpers/AppError"

describe("OpportunityController Integration", () => {
  const token = createTestToken()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("GET /opportunities", () => {
    it("returns 200 with list of opportunities", async () => {
      const mockOpportunities = [
        { id: 1, contactId: 1, pipelineId: 1, stageId: 1, value: 1000, status: "open" },
        { id: 2, contactId: 2, pipelineId: 1, stageId: 2, value: 2000, status: "won" }
      ]
      vi.mocked(OpportunityService.listOpportunities).mockResolvedValue({
        opportunities: mockOpportunities as never,
        count: 2,
        hasMore: false
      })

      const response = await request(app)
        .get("/opportunities")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockOpportunities)
      expect(response.body.meta).toEqual({
        total: 2,
        page: 1,
        limit: 20,
        hasMore: false
      })
    })

    it("returns 401 without auth token", async () => {
      const response = await request(app).get("/opportunities")

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(OpportunityService.listOpportunities).not.toHaveBeenCalled()
    })
  })

  describe("GET /opportunities/:id", () => {
    it("returns 200 with opportunity details", async () => {
      const mockOpportunity = { id: 1, contactId: 1, pipelineId: 1, stageId: 1, value: 1000 }
      vi.mocked(OpportunityService.findOpportunityById).mockResolvedValue(mockOpportunity as never)

      const response = await request(app)
        .get("/opportunities/1")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockOpportunity)
      expect(OpportunityService.findOpportunityById).toHaveBeenCalledWith(1, 1)
    })

    it("returns 404 when opportunity is not found", async () => {
      vi.mocked(OpportunityService.findOpportunityById).mockRejectedValue(
        new AppError("Opportunity not found", 404)
      )

      const response = await request(app)
        .get("/opportunities/999")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })
  })

  describe("POST /opportunities", () => {
    it("returns 201 with created opportunity", async () => {
      const mockOpportunity = { id: 3, contactId: 1, pipelineId: 1, stageId: 1, value: 500 }
      vi.mocked(OpportunityService.createOpportunity).mockResolvedValue(mockOpportunity as never)

      const response = await request(app)
        .post("/opportunities")
        .set("Authorization", `Bearer ${token}`)
        .send({ contactId: 1, pipelineId: 1, stageId: 1, value: 500 })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockOpportunity)
    })
  })

  describe("PUT /opportunities/:id", () => {
    it("returns 200 with updated opportunity", async () => {
      const mockOpportunity = { id: 1, contactId: 1, pipelineId: 1, stageId: 1, value: 1500 }
      vi.mocked(OpportunityService.updateOpportunity).mockResolvedValue(mockOpportunity as never)

      const response = await request(app)
        .put("/opportunities/1")
        .set("Authorization", `Bearer ${token}`)
        .send({ value: 1500 })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockOpportunity)
    })
  })

  describe("PUT /opportunities/:id/move", () => {
    it("returns 200 when moving opportunity to another stage", async () => {
      const mockOpportunity = { id: 1, contactId: 1, pipelineId: 1, stageId: 3, value: 1000 }
      vi.mocked(OpportunityService.moveOpportunity).mockResolvedValue(mockOpportunity as never)

      const response = await request(app)
        .put("/opportunities/1/move")
        .set("Authorization", `Bearer ${token}`)
        .send({ stageId: 3 })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockOpportunity)
      expect(OpportunityService.moveOpportunity).toHaveBeenCalledWith(1, 1, 3)
    })
  })

  describe("DELETE /opportunities/:id", () => {
    it("returns 200 on successful deletion", async () => {
      vi.mocked(OpportunityService.deleteOpportunity).mockResolvedValue(undefined)

      const response = await request(app)
        .delete("/opportunities/1")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.message).toBe("Opportunity deleted successfully")
      expect(OpportunityService.deleteOpportunity).toHaveBeenCalledWith(1, 1)
    })
  })
})

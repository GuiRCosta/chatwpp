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
import * as ChatFlowService from "@/services/ChatFlowService"
import { AppError } from "@/helpers/AppError"

describe("ChatFlowController Integration", () => {
  const token = createTestToken()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("GET /chatflows", () => {
    it("returns 200 with list of chat flows", async () => {
      const mockChatFlows = [
        { id: 1, name: "Welcome Flow", isActive: true },
        { id: 2, name: "Support Flow", isActive: false }
      ]
      vi.mocked(ChatFlowService.listChatFlows).mockResolvedValue(mockChatFlows as never)

      const response = await request(app)
        .get("/chatflows")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockChatFlows)
    })

    it("returns 401 without auth token", async () => {
      const response = await request(app).get("/chatflows")

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(ChatFlowService.listChatFlows).not.toHaveBeenCalled()
    })
  })

  describe("GET /chatflows/:id", () => {
    it("returns 200 with chat flow details", async () => {
      const mockChatFlow = { id: 1, name: "Welcome Flow", isActive: true }
      vi.mocked(ChatFlowService.findChatFlowById).mockResolvedValue(mockChatFlow as never)

      const response = await request(app)
        .get("/chatflows/1")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockChatFlow)
      expect(ChatFlowService.findChatFlowById).toHaveBeenCalledWith(1, 1)
    })

    it("returns 404 when chat flow is not found", async () => {
      vi.mocked(ChatFlowService.findChatFlowById).mockRejectedValue(
        new AppError("ChatFlow not found", 404)
      )

      const response = await request(app)
        .get("/chatflows/999")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })
  })

  describe("POST /chatflows", () => {
    it("returns 201 with created chat flow", async () => {
      const mockChatFlow = { id: 3, name: "New Flow", isActive: true }
      vi.mocked(ChatFlowService.createChatFlow).mockResolvedValue(mockChatFlow as never)

      const response = await request(app)
        .post("/chatflows")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "New Flow" })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockChatFlow)
    })
  })

  describe("PUT /chatflows/:id", () => {
    it("returns 200 with updated chat flow", async () => {
      const mockChatFlow = { id: 1, name: "Updated Flow", isActive: true }
      vi.mocked(ChatFlowService.updateChatFlow).mockResolvedValue(mockChatFlow as never)

      const response = await request(app)
        .put("/chatflows/1")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Flow" })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockChatFlow)
    })
  })

  describe("DELETE /chatflows/:id", () => {
    it("returns 200 on successful deletion", async () => {
      vi.mocked(ChatFlowService.deleteChatFlow).mockResolvedValue(undefined)

      const response = await request(app)
        .delete("/chatflows/1")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.message).toBe("ChatFlow deleted successfully")
      expect(ChatFlowService.deleteChatFlow).toHaveBeenCalledWith(1, 1)
    })
  })

  describe("POST /chatflows/:id/duplicate", () => {
    it("returns 201 with duplicated chat flow", async () => {
      const mockChatFlow = { id: 4, name: "Welcome Flow (copy)", isActive: false }
      vi.mocked(ChatFlowService.duplicateChatFlow).mockResolvedValue(mockChatFlow as never)

      const response = await request(app)
        .post("/chatflows/1/duplicate")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockChatFlow)
      expect(ChatFlowService.duplicateChatFlow).toHaveBeenCalledWith(1, 1)
    })
  })
})

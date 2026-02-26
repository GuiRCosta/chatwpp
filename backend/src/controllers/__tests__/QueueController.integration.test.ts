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
import * as QueueService from "@/services/QueueService"

describe("QueueController Integration", () => {
  const token = createTestToken()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("GET /queues", () => {
    it("returns 200 with list of queues", async () => {
      const mockQueues = [
        { id: 1, name: "Support", color: "#FF0000" },
        { id: 2, name: "Sales", color: "#00FF00" }
      ]
      vi.mocked(QueueService.listQueues).mockResolvedValue(mockQueues as never)

      const response = await request(app)
        .get("/queues")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockQueues)
    })

    it("returns 401 without auth token", async () => {
      const response = await request(app).get("/queues")

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(QueueService.listQueues).not.toHaveBeenCalled()
    })
  })

  describe("POST /queues", () => {
    it("returns 201 with created queue", async () => {
      const mockQueue = { id: 3, name: "Billing", color: "#0000FF" }
      vi.mocked(QueueService.createQueue).mockResolvedValue(mockQueue as never)

      const response = await request(app)
        .post("/queues")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Billing", color: "#0000FF" })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockQueue)
    })

    it("returns 403 for non-admin users", async () => {
      const userToken = createTestToken({ profile: "user" })

      const response = await request(app)
        .post("/queues")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "Billing", color: "#0000FF" })

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
    })
  })

  describe("PUT /queues/:id", () => {
    it("returns 200 with updated queue", async () => {
      const mockQueue = { id: 1, name: "Updated Support", color: "#FF0000" }
      vi.mocked(QueueService.updateQueue).mockResolvedValue(mockQueue as never)

      const response = await request(app)
        .put("/queues/1")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Support" })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockQueue)
    })
  })

  describe("DELETE /queues/:id", () => {
    it("returns 200 on successful deletion", async () => {
      vi.mocked(QueueService.deleteQueue).mockResolvedValue(undefined)

      const response = await request(app)
        .delete("/queues/1")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.message).toBe("Queue deleted successfully")
      expect(QueueService.deleteQueue).toHaveBeenCalledWith(1, 1)
    })
  })
})

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
import * as KanbanService from "@/services/KanbanService"
import { AppError } from "@/helpers/AppError"

describe("KanbanController Integration", () => {
  const token = createTestToken()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("GET /kanbans", () => {
    it("returns 200 with list of kanbans", async () => {
      const mockKanbans = [
        { id: 1, name: "Sales Board" },
        { id: 2, name: "Support Board" }
      ]
      vi.mocked(KanbanService.listKanbans).mockResolvedValue(mockKanbans as never)

      const response = await request(app)
        .get("/kanbans")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockKanbans)
    })

    it("returns 401 without auth token", async () => {
      const response = await request(app).get("/kanbans")

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(KanbanService.listKanbans).not.toHaveBeenCalled()
    })
  })

  describe("GET /kanbans/:id", () => {
    it("returns 200 with kanban details", async () => {
      const mockKanban = { id: 1, name: "Sales Board", stages: [] }
      vi.mocked(KanbanService.findKanbanById).mockResolvedValue(mockKanban as never)

      const response = await request(app)
        .get("/kanbans/1")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockKanban)
      expect(KanbanService.findKanbanById).toHaveBeenCalledWith(1, 1)
    })

    it("returns 404 when kanban is not found", async () => {
      vi.mocked(KanbanService.findKanbanById).mockRejectedValue(
        new AppError("Kanban not found", 404)
      )

      const response = await request(app)
        .get("/kanbans/999")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })
  })

  describe("POST /kanbans", () => {
    it("returns 201 with created kanban", async () => {
      const mockKanban = { id: 3, name: "New Board" }
      vi.mocked(KanbanService.createKanban).mockResolvedValue(mockKanban as never)

      const response = await request(app)
        .post("/kanbans")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "New Board" })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockKanban)
    })
  })

  describe("PUT /kanbans/:id", () => {
    it("returns 200 with updated kanban", async () => {
      const mockKanban = { id: 1, name: "Updated Board" }
      vi.mocked(KanbanService.updateKanban).mockResolvedValue(mockKanban as never)

      const response = await request(app)
        .put("/kanbans/1")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Board" })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockKanban)
    })
  })

  describe("DELETE /kanbans/:id", () => {
    it("returns 200 on successful deletion", async () => {
      vi.mocked(KanbanService.deleteKanban).mockResolvedValue(undefined)

      const response = await request(app)
        .delete("/kanbans/1")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.message).toBe("Kanban deleted successfully")
      expect(KanbanService.deleteKanban).toHaveBeenCalledWith(1, 1)
    })
  })

  describe("POST /kanbans/:kanbanId/stages", () => {
    it("returns 201 with created stage", async () => {
      const mockStage = { id: 1, name: "To Do", order: 0 }
      vi.mocked(KanbanService.createStage).mockResolvedValue(mockStage as never)

      const response = await request(app)
        .post("/kanbans/1/stages")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "To Do", order: 0 })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockStage)
      expect(KanbanService.createStage).toHaveBeenCalledWith(
        1,
        1,
        expect.objectContaining({ name: "To Do", order: 0 })
      )
    })
  })

  describe("DELETE /kanbans/:kanbanId/stages/:stageId", () => {
    it("returns 200 on successful stage deletion", async () => {
      vi.mocked(KanbanService.deleteStage).mockResolvedValue(undefined)

      const response = await request(app)
        .delete("/kanbans/1/stages/2")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.message).toBe("Stage deleted successfully")
      expect(KanbanService.deleteStage).toHaveBeenCalledWith(1, 2, 1)
    })
  })
})

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
vi.mock("@/services/WhatsAppService", () => ({ listWhatsApps: vi.fn(), findWhatsAppById: vi.fn(), createWhatsApp: vi.fn(), updateWhatsApp: vi.fn(), deleteWhatsApp: vi.fn(), onboardFromFBL: vi.fn(), requestQRCode: vi.fn(), disconnectSession: vi.fn() }))
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
import * as WhatsAppService from "@/services/WhatsAppService"
import { AppError } from "@/helpers/AppError"

describe("WhatsAppController Integration", () => {
  const token = createTestToken()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("GET /whatsapp", () => {
    it("returns 200 with list of whatsapp connections", async () => {
      const mockWhatsApps = [
        { id: 1, name: "Main", status: "connected" },
        { id: 2, name: "Secondary", status: "disconnected" }
      ]
      vi.mocked(WhatsAppService.listWhatsApps).mockResolvedValue(mockWhatsApps as never)

      const response = await request(app)
        .get("/whatsapp")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockWhatsApps)
      expect(WhatsAppService.listWhatsApps).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 1 })
      )
    })

    it("returns 401 without auth token", async () => {
      const response = await request(app).get("/whatsapp")

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(WhatsAppService.listWhatsApps).not.toHaveBeenCalled()
    })
  })

  describe("POST /whatsapp", () => {
    it("returns 201 with created whatsapp connection", async () => {
      const mockWhatsApp = { id: 3, name: "New Connection", status: "opening" }
      vi.mocked(WhatsAppService.createWhatsApp).mockResolvedValue(mockWhatsApp as never)

      const response = await request(app)
        .post("/whatsapp")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "New Connection" })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockWhatsApp)
      expect(WhatsAppService.createWhatsApp).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ name: "New Connection" })
      )
    })

    it("returns 403 for non-admin users", async () => {
      const userToken = createTestToken({ profile: "user" })

      const response = await request(app)
        .post("/whatsapp")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "New Connection" })

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
      expect(WhatsAppService.createWhatsApp).not.toHaveBeenCalled()
    })

    it("returns error when required fields are missing", async () => {
      const response = await request(app)
        .post("/whatsapp")
        .set("Authorization", `Bearer ${token}`)
        .send({})

      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(WhatsAppService.createWhatsApp).not.toHaveBeenCalled()
    })
  })

  describe("POST /whatsapp/onboard", () => {
    it("returns 201 with onboarded whatsapp connection", async () => {
      const mockWhatsApp = { id: 4, name: "FBL Connection", status: "connected" }
      vi.mocked(WhatsAppService.onboardFromFBL).mockResolvedValue(mockWhatsApp as never)

      const response = await request(app)
        .post("/whatsapp/onboard")
        .set("Authorization", `Bearer ${token}`)
        .send({
          code: "auth-code-123",
          wabaId: "12345",
          phoneNumberId: "67890",
          name: "FBL Connection"
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockWhatsApp)
      expect(WhatsAppService.onboardFromFBL).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          code: "auth-code-123",
          wabaId: "12345",
          phoneNumberId: "67890",
          name: "FBL Connection"
        })
      )
    })

    it("returns 403 for non-admin users", async () => {
      const userToken = createTestToken({ profile: "user" })

      const response = await request(app)
        .post("/whatsapp/onboard")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          code: "auth-code-123",
          wabaId: "12345",
          phoneNumberId: "67890",
          name: "FBL Connection"
        })

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
      expect(WhatsAppService.onboardFromFBL).not.toHaveBeenCalled()
    })

    it("returns error when required fields are missing", async () => {
      const response = await request(app)
        .post("/whatsapp/onboard")
        .set("Authorization", `Bearer ${token}`)
        .send({ code: "auth-code-123" })

      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(WhatsAppService.onboardFromFBL).not.toHaveBeenCalled()
    })
  })

  describe("PUT /whatsapp/:id", () => {
    it("returns 200 with updated whatsapp connection", async () => {
      const mockWhatsApp = { id: 1, name: "Updated Connection", status: "connected" }
      vi.mocked(WhatsAppService.updateWhatsApp).mockResolvedValue(mockWhatsApp as never)

      const response = await request(app)
        .put("/whatsapp/1")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Connection" })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockWhatsApp)
      expect(WhatsAppService.updateWhatsApp).toHaveBeenCalledWith(
        1,
        1,
        expect.objectContaining({ name: "Updated Connection" })
      )
    })

    it("returns 403 for non-admin users", async () => {
      const userToken = createTestToken({ profile: "user" })

      const response = await request(app)
        .put("/whatsapp/1")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "Updated Connection" })

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
      expect(WhatsAppService.updateWhatsApp).not.toHaveBeenCalled()
    })
  })

  describe("DELETE /whatsapp/:id", () => {
    it("returns 200 on successful deletion", async () => {
      vi.mocked(WhatsAppService.deleteWhatsApp).mockResolvedValue(undefined)

      const response = await request(app)
        .delete("/whatsapp/1")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.message).toBe("WhatsApp connection deleted successfully")
      expect(WhatsAppService.deleteWhatsApp).toHaveBeenCalledWith(1, 1)
    })

    it("returns 403 for non-admin users", async () => {
      const userToken = createTestToken({ profile: "user" })

      const response = await request(app)
        .delete("/whatsapp/1")
        .set("Authorization", `Bearer ${userToken}`)

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
      expect(WhatsAppService.deleteWhatsApp).not.toHaveBeenCalled()
    })

    it("returns error when whatsapp is not found", async () => {
      vi.mocked(WhatsAppService.deleteWhatsApp).mockRejectedValue(
        new AppError("WhatsApp connection not found", 404)
      )

      const response = await request(app)
        .delete("/whatsapp/999")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe("WhatsApp connection not found")
    })
  })
})

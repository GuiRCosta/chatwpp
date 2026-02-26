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
vi.mock("@/libs/waba/webhookHandler", () => ({
  verifyWebhook: vi.fn(),
  processWebhook: vi.fn()
}))
vi.mock("@/libs/waba/webhookSignature", () => ({
  verifySignature: vi.fn()
}))

// --- Mock ALL services (controllers import services which import models) ---
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
import * as AuthService from "@/services/AuthService"
import { AppError } from "@/helpers/AppError"

describe("AuthController Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("POST /auth/login", () => {
    it("returns 200 with token and user data on successful login", async () => {
      const mockResult = {
        token: "mock-token",
        refreshToken: "mock-refresh-token",
        user: { id: 1, tenantId: 1, name: "Admin", email: "admin@test.com", profile: "admin" }
      }
      vi.mocked(AuthService.login).mockResolvedValue(mockResult)

      const response = await request(app)
        .post("/auth/login")
        .send({ email: "admin@test.com", password: "123456" })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockResult)
      expect(AuthService.login).toHaveBeenCalledWith({
        email: "admin@test.com",
        password: "123456"
      })
    })

    it("returns validation error when email is missing", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({ password: "123456" })

      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(AuthService.login).not.toHaveBeenCalled()
    })

    it("returns validation error when password is missing", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({ email: "admin@test.com" })

      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(AuthService.login).not.toHaveBeenCalled()
    })

    it("returns 401 when credentials are wrong", async () => {
      vi.mocked(AuthService.login).mockRejectedValue(
        new AppError("Invalid email or password", 401)
      )

      const response = await request(app)
        .post("/auth/login")
        .send({ email: "wrong@test.com", password: "wrong123" })

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe("Invalid email or password")
    })
  })

  describe("POST /auth/refresh", () => {
    it("returns 200 with new tokens on successful refresh", async () => {
      const mockTokens = { token: "new-token", refreshToken: "new-refresh-token" }
      vi.mocked(AuthService.refreshTokens).mockResolvedValue(mockTokens)

      const response = await request(app)
        .post("/auth/refresh")
        .send({ refreshToken: "old-refresh-token" })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockTokens)
      expect(AuthService.refreshTokens).toHaveBeenCalledWith("old-refresh-token")
    })

    it("returns error when refreshToken is missing", async () => {
      const response = await request(app)
        .post("/auth/refresh")
        .send({})

      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(AuthService.refreshTokens).not.toHaveBeenCalled()
    })
  })

  describe("POST /auth/logout", () => {
    it("returns 200 on successful logout with auth token", async () => {
      const token = createTestToken()
      vi.mocked(AuthService.logout).mockResolvedValue(undefined)

      const response = await request(app)
        .post("/auth/logout")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.message).toBe("Logged out successfully")
      expect(AuthService.logout).toHaveBeenCalledWith(1)
    })

    it("returns 401 without auth token", async () => {
      const response = await request(app)
        .post("/auth/logout")

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(AuthService.logout).not.toHaveBeenCalled()
    })
  })
})

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
import * as UserService from "@/services/UserService"
import { AppError } from "@/helpers/AppError"

describe("UserController Integration", () => {
  const adminToken = createTestToken({ profile: "admin" })
  const userToken = createTestToken({ id: 2, profile: "user" })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("GET /users", () => {
    it("returns 200 with list of users", async () => {
      const mockUsers = [
        { id: 1, name: "Admin", email: "admin@test.com" },
        { id: 2, name: "User", email: "user@test.com" }
      ]
      vi.mocked(UserService.listUsers).mockResolvedValue({
        users: mockUsers as never,
        count: 2,
        hasMore: false
      })

      const response = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockUsers)
      expect(response.body.meta).toEqual({
        total: 2,
        page: 1,
        limit: 20,
        hasMore: false
      })
    })

    it("returns 401 without auth token", async () => {
      const response = await request(app).get("/users")

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
    })
  })

  describe("GET /users/:id", () => {
    it("returns 200 with user details", async () => {
      const mockUser = { id: 1, name: "Admin", email: "admin@test.com" }
      vi.mocked(UserService.findUserById).mockResolvedValue(mockUser as never)

      const response = await request(app)
        .get("/users/1")
        .set("Authorization", `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockUser)
      expect(UserService.findUserById).toHaveBeenCalledWith(1, 1)
    })

    it("returns 404 when user is not found", async () => {
      vi.mocked(UserService.findUserById).mockRejectedValue(
        new AppError("User not found", 404)
      )

      const response = await request(app)
        .get("/users/999")
        .set("Authorization", `Bearer ${adminToken}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe("User not found")
    })
  })

  describe("POST /users", () => {
    it("returns 201 with created user (admin)", async () => {
      const mockUser = { id: 3, name: "New User", email: "new@test.com", profile: "user" }
      vi.mocked(UserService.createUser).mockResolvedValue(mockUser as never)

      const response = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "New User", email: "new@test.com", password: "123456" })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockUser)
      expect(UserService.createUser).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          name: "New User",
          email: "new@test.com",
          password: "123456"
        })
      )
    })

    it("returns 403 when non-admin tries to create user", async () => {
      const response = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "New User", email: "new@test.com", password: "123456" })

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
      expect(UserService.createUser).not.toHaveBeenCalled()
    })

    it("returns error when required fields are missing", async () => {
      const response = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "New User" })

      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(UserService.createUser).not.toHaveBeenCalled()
    })
  })

  describe("PUT /users/:id", () => {
    it("returns 200 with updated user (admin)", async () => {
      const mockUser = { id: 1, name: "Updated Name", email: "admin@test.com" }
      vi.mocked(UserService.updateUser).mockResolvedValue(mockUser as never)

      const response = await request(app)
        .put("/users/1")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Updated Name" })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockUser)
      expect(UserService.updateUser).toHaveBeenCalledWith(
        1,
        1,
        expect.objectContaining({ name: "Updated Name" })
      )
    })

    it("returns 403 when non-admin tries to update user", async () => {
      const response = await request(app)
        .put("/users/1")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "Updated Name" })

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
      expect(UserService.updateUser).not.toHaveBeenCalled()
    })
  })

  describe("DELETE /users/:id", () => {
    it("returns 200 on successful deletion (admin)", async () => {
      vi.mocked(UserService.deleteUser).mockResolvedValue(undefined)

      const response = await request(app)
        .delete("/users/1")
        .set("Authorization", `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.message).toBe("User deleted successfully")
      expect(UserService.deleteUser).toHaveBeenCalledWith(1, 1)
    })

    it("returns 403 when non-admin tries to delete user", async () => {
      const response = await request(app)
        .delete("/users/1")
        .set("Authorization", `Bearer ${userToken}`)

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
      expect(UserService.deleteUser).not.toHaveBeenCalled()
    })

    it("returns 404 when user to delete is not found", async () => {
      vi.mocked(UserService.deleteUser).mockRejectedValue(
        new AppError("User not found", 404)
      )

      const response = await request(app)
        .delete("/users/999")
        .set("Authorization", `Bearer ${adminToken}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe("User not found")
    })
  })
})

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
import * as TodoListService from "@/services/TodoListService"
import { AppError } from "@/helpers/AppError"

describe("TodoListController Integration", () => {
  const token = createTestToken()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("GET /todolists", () => {
    it("returns 200 with list of todolists", async () => {
      const mockTodoLists = [
        { id: 1, title: "Task 1", done: false },
        { id: 2, title: "Task 2", done: true }
      ]
      vi.mocked(TodoListService.listTodoLists).mockResolvedValue(mockTodoLists as never)

      const response = await request(app)
        .get("/todolists")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockTodoLists)
      expect(TodoListService.listTodoLists).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          userId: 1
        })
      )
    })

    it("passes done filter when provided", async () => {
      vi.mocked(TodoListService.listTodoLists).mockResolvedValue([] as never)

      await request(app)
        .get("/todolists?done=true")
        .set("Authorization", `Bearer ${token}`)

      expect(TodoListService.listTodoLists).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          userId: 1,
          done: true
        })
      )
    })

    it("returns 401 without auth token", async () => {
      const response = await request(app).get("/todolists")

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(TodoListService.listTodoLists).not.toHaveBeenCalled()
    })
  })

  describe("GET /todolists/:id", () => {
    it("returns 200 with todolist details", async () => {
      const mockTodoList = { id: 1, title: "Task 1", done: false }
      vi.mocked(TodoListService.findTodoListById).mockResolvedValue(mockTodoList as never)

      const response = await request(app)
        .get("/todolists/1")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockTodoList)
      expect(TodoListService.findTodoListById).toHaveBeenCalledWith(1, 1, 1)
    })

    it("returns error when todolist is not found", async () => {
      vi.mocked(TodoListService.findTodoListById).mockRejectedValue(
        new AppError("TodoList not found", 404)
      )

      const response = await request(app)
        .get("/todolists/999")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe("TodoList not found")
    })
  })

  describe("POST /todolists", () => {
    it("returns 201 with created todolist", async () => {
      const mockTodoList = { id: 3, title: "New Task", done: false }
      vi.mocked(TodoListService.createTodoList).mockResolvedValue(mockTodoList as never)

      const response = await request(app)
        .post("/todolists")
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "New Task", description: "A new task" })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockTodoList)
      expect(TodoListService.createTodoList).toHaveBeenCalledWith(
        1,
        1,
        expect.objectContaining({ title: "New Task" })
      )
    })

    it("returns error when required fields are missing", async () => {
      const response = await request(app)
        .post("/todolists")
        .set("Authorization", `Bearer ${token}`)
        .send({})

      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(TodoListService.createTodoList).not.toHaveBeenCalled()
    })
  })

  describe("PUT /todolists/:id", () => {
    it("returns 200 with updated todolist", async () => {
      const mockTodoList = { id: 1, title: "Updated Task", done: false }
      vi.mocked(TodoListService.updateTodoList).mockResolvedValue(mockTodoList as never)

      const response = await request(app)
        .put("/todolists/1")
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Updated Task" })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockTodoList)
      expect(TodoListService.updateTodoList).toHaveBeenCalledWith(
        1,
        1,
        1,
        expect.objectContaining({ title: "Updated Task" })
      )
    })
  })

  describe("PUT /todolists/:id/toggle", () => {
    it("returns 200 with toggled todolist", async () => {
      const mockTodoList = { id: 1, title: "Task 1", done: true }
      vi.mocked(TodoListService.toggleTodoList).mockResolvedValue(mockTodoList as never)

      const response = await request(app)
        .put("/todolists/1/toggle")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockTodoList)
      expect(TodoListService.toggleTodoList).toHaveBeenCalledWith(1, 1, 1)
    })

    it("returns error when todolist is not found", async () => {
      vi.mocked(TodoListService.toggleTodoList).mockRejectedValue(
        new AppError("TodoList not found", 404)
      )

      const response = await request(app)
        .put("/todolists/999/toggle")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe("TodoList not found")
    })
  })

  describe("DELETE /todolists/:id", () => {
    it("returns 200 on successful deletion", async () => {
      vi.mocked(TodoListService.deleteTodoList).mockResolvedValue(undefined)

      const response = await request(app)
        .delete("/todolists/1")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.message).toBe("TodoList deleted successfully")
      expect(TodoListService.deleteTodoList).toHaveBeenCalledWith(1, 1, 1)
    })

    it("returns error when todolist is not found", async () => {
      vi.mocked(TodoListService.deleteTodoList).mockRejectedValue(
        new AppError("TodoList not found", 404)
      )

      const response = await request(app)
        .delete("/todolists/999")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe("TodoList not found")
    })
  })
})

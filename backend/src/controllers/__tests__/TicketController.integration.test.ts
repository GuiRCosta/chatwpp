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
import * as TicketService from "@/services/TicketService"
import { AppError } from "@/helpers/AppError"

describe("TicketController Integration", () => {
  const token = createTestToken()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("GET /tickets", () => {
    it("returns 200 with list of tickets", async () => {
      const mockTickets = [
        { id: 1, status: "open", contactId: 1 },
        { id: 2, status: "pending", contactId: 2 }
      ]
      vi.mocked(TicketService.listTickets).mockResolvedValue({
        tickets: mockTickets as never,
        count: 2,
        hasMore: false
      })

      const response = await request(app)
        .get("/tickets")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockTickets)
      expect(response.body.meta).toEqual({
        total: 2,
        page: 1,
        limit: 40,
        hasMore: false
      })
      expect(TicketService.listTickets).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          searchParam: "",
          pageNumber: "1",
          limit: "40"
        })
      )
    })

    it("returns 401 without auth token", async () => {
      const response = await request(app).get("/tickets")

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(TicketService.listTickets).not.toHaveBeenCalled()
    })
  })

  describe("GET /tickets/:id", () => {
    it("returns 200 with ticket details", async () => {
      const mockTicket = { id: 1, status: "open", contactId: 1 }
      vi.mocked(TicketService.findTicketById).mockResolvedValue(mockTicket as never)

      const response = await request(app)
        .get("/tickets/1")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockTicket)
      expect(TicketService.findTicketById).toHaveBeenCalledWith(1, 1)
    })

    it("returns 404 when ticket is not found", async () => {
      vi.mocked(TicketService.findTicketById).mockRejectedValue(
        new AppError("Ticket not found", 404)
      )

      const response = await request(app)
        .get("/tickets/999")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe("Ticket not found")
    })
  })

  describe("POST /tickets", () => {
    it("returns 201 with created ticket", async () => {
      const mockTicket = { id: 1, status: "pending", contactId: 10 }
      vi.mocked(TicketService.createTicket).mockResolvedValue(mockTicket as never)

      const response = await request(app)
        .post("/tickets")
        .set("Authorization", `Bearer ${token}`)
        .send({ contactId: 10 })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockTicket)
      expect(TicketService.createTicket).toHaveBeenCalledWith(
        1,
        1,
        expect.objectContaining({ contactId: 10 })
      )
    })

    it("returns error when contactId is missing", async () => {
      const response = await request(app)
        .post("/tickets")
        .set("Authorization", `Bearer ${token}`)
        .send({})

      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(TicketService.createTicket).not.toHaveBeenCalled()
    })
  })

  describe("PUT /tickets/:id", () => {
    it("returns 200 with updated ticket", async () => {
      const mockTicket = { id: 1, status: "closed" }
      vi.mocked(TicketService.updateTicket).mockResolvedValue(mockTicket as never)

      const response = await request(app)
        .put("/tickets/1")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "closed" })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockTicket)
      expect(TicketService.updateTicket).toHaveBeenCalledWith(
        1,
        1,
        1,
        expect.objectContaining({ status: "closed" })
      )
    })
  })

  describe("DELETE /tickets/:id", () => {
    it("returns 200 on successful deletion", async () => {
      vi.mocked(TicketService.deleteTicket).mockResolvedValue(undefined)

      const response = await request(app)
        .delete("/tickets/1")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.message).toBe("Ticket deleted successfully")
      expect(TicketService.deleteTicket).toHaveBeenCalledWith(1, 1)
    })

    it("returns 404 when ticket to delete is not found", async () => {
      vi.mocked(TicketService.deleteTicket).mockRejectedValue(
        new AppError("Ticket not found", 404)
      )

      const response = await request(app)
        .delete("/tickets/999")
        .set("Authorization", `Bearer ${token}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe("Ticket not found")
    })
  })
})

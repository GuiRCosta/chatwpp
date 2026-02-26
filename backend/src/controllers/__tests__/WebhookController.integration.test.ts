import { describe, it, expect, vi, beforeEach } from "vitest"
import request from "supertest"

// --- Infrastructure mocks (prevent DB/Redis connections) ---
vi.mock("@/libs/bullBoard", () => ({
  setupBullBoard: vi.fn().mockReturnValue({
    getRouter: () => (_req: unknown, _res: unknown, next: () => void) => next()
  })
}))

// --- Logger mock (WebhookController uses default import) ---
vi.mock("@/helpers/logger", () => {
  const loggerObj = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
  return { logger: loggerObj, default: loggerObj }
})

// --- Webhook mocks ---
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
import { verifyWebhook, processWebhook } from "@/libs/waba/webhookHandler"
import { verifySignature } from "@/libs/waba/webhookSignature"

describe("WebhookController Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.META_APP_SECRET
  })

  describe("GET /webhook (verify)", () => {
    it("returns 200 with challenge when verification succeeds", async () => {
      vi.mocked(verifyWebhook).mockReturnValue("challenge-token-123")

      const response = await request(app)
        .get("/webhook")
        .query({
          "hub.mode": "subscribe",
          "hub.verify_token": "my-verify-token",
          "hub.challenge": "challenge-token-123"
        })

      expect(response.status).toBe(200)
      expect(response.text).toBe("challenge-token-123")
      expect(verifyWebhook).toHaveBeenCalledWith(
        "subscribe",
        "my-verify-token",
        "challenge-token-123"
      )
    })

    it("returns 403 when verification fails", async () => {
      vi.mocked(verifyWebhook).mockReturnValue(null as never)

      const response = await request(app)
        .get("/webhook")
        .query({
          "hub.mode": "subscribe",
          "hub.verify_token": "wrong-token",
          "hub.challenge": "challenge-token-123"
        })

      expect(response.status).toBe(403)
      expect(response.body.error).toBe("Verification failed")
    })

    it("returns 403 when query params are missing", async () => {
      vi.mocked(verifyWebhook).mockReturnValue(null as never)

      const response = await request(app).get("/webhook")

      expect(response.status).toBe(403)
      expect(verifyWebhook).toHaveBeenCalledWith(undefined, undefined, undefined)
    })
  })

  describe("POST /webhook (receive)", () => {
    it("returns 200 and processes webhook payload", async () => {
      vi.mocked(processWebhook).mockResolvedValue(undefined)

      const payload = {
        object: "whatsapp_business_account",
        entry: [{ id: "123", changes: [] }]
      }

      const response = await request(app)
        .post("/webhook")
        .send(payload)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe("received")
      expect(processWebhook).toHaveBeenCalledWith(payload)
    })

    it("returns 200 even when processWebhook throws", async () => {
      vi.mocked(processWebhook).mockRejectedValue(new Error("Processing failed"))

      const response = await request(app)
        .post("/webhook")
        .send({ object: "whatsapp_business_account" })

      expect(response.status).toBe(200)
      expect(response.body.status).toBe("received")
    })

    it("returns 403 when signature verification fails and META_APP_SECRET is set", async () => {
      process.env.META_APP_SECRET = "test-app-secret"
      vi.mocked(verifySignature).mockReturnValue(false)

      const response = await request(app)
        .post("/webhook")
        .set("x-hub-signature-256", "sha256=invalidsignature")
        .send({ object: "whatsapp_business_account" })

      expect(response.status).toBe(403)
      expect(response.body.error).toBe("Invalid signature")
      expect(processWebhook).not.toHaveBeenCalled()
    })

    it("processes webhook when signature is valid and META_APP_SECRET is set", async () => {
      process.env.META_APP_SECRET = "test-app-secret"
      vi.mocked(verifySignature).mockReturnValue(true)
      vi.mocked(processWebhook).mockResolvedValue(undefined)

      const payload = { object: "whatsapp_business_account" }

      const response = await request(app)
        .post("/webhook")
        .set("x-hub-signature-256", "sha256=validsignature")
        .send(payload)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe("received")
      expect(processWebhook).toHaveBeenCalledWith(payload)
    })

    it("skips signature verification when META_APP_SECRET is not set", async () => {
      vi.mocked(processWebhook).mockResolvedValue(undefined)

      const payload = { object: "whatsapp_business_account" }

      const response = await request(app)
        .post("/webhook")
        .send(payload)

      expect(response.status).toBe(200)
      expect(verifySignature).not.toHaveBeenCalled()
      expect(processWebhook).toHaveBeenCalledWith(payload)
    })
  })
})

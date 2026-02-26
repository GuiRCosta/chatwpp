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
import * as SettingService from "@/services/SettingService"

describe("SettingController Integration", () => {
  const adminToken = createTestToken({ profile: "admin" })
  const userToken = createTestToken({ id: 2, profile: "user" })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("GET /settings", () => {
    it("returns 200 with settings map", async () => {
      const mockSettings = {
        timezone: "America/Sao_Paulo",
        language: "pt-BR",
        businessHoursEnabled: "true"
      }
      vi.mocked(SettingService.getSettings).mockResolvedValue(mockSettings)

      const response = await request(app)
        .get("/settings")
        .set("Authorization", `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockSettings)
      expect(SettingService.getSettings).toHaveBeenCalledWith(1)
    })

    it("returns 401 without auth token", async () => {
      const response = await request(app).get("/settings")

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(SettingService.getSettings).not.toHaveBeenCalled()
    })
  })

  describe("PUT /settings", () => {
    it("returns 200 with updated setting (admin)", async () => {
      const mockSetting = { id: 1, key: "timezone", value: "UTC" }
      vi.mocked(SettingService.updateSetting).mockResolvedValue(mockSetting as never)

      const response = await request(app)
        .put("/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ key: "timezone", value: "UTC" })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockSetting)
      expect(SettingService.updateSetting).toHaveBeenCalledWith(1, "timezone", "UTC")
    })

    it("returns 403 when non-admin tries to update settings", async () => {
      const response = await request(app)
        .put("/settings")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ key: "timezone", value: "UTC" })

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
      expect(SettingService.updateSetting).not.toHaveBeenCalled()
    })

    it("returns error when key is missing", async () => {
      const response = await request(app)
        .put("/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ value: "UTC" })

      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(SettingService.updateSetting).not.toHaveBeenCalled()
    })

    it("returns error when value is missing", async () => {
      const response = await request(app)
        .put("/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ key: "timezone" })

      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(SettingService.updateSetting).not.toHaveBeenCalled()
    })
  })

  describe("PUT /settings/bulk", () => {
    it("returns 200 with updated settings (admin)", async () => {
      const mockSettings = { timezone: "UTC", language: "en-US" }
      vi.mocked(SettingService.updateSettingsBulk).mockResolvedValue(mockSettings)

      const response = await request(app)
        .put("/settings/bulk")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          settings: [
            { key: "timezone", value: "UTC" },
            { key: "language", value: "en-US" }
          ]
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockSettings)
      expect(SettingService.updateSettingsBulk).toHaveBeenCalledWith(1, [
        { key: "timezone", value: "UTC" },
        { key: "language", value: "en-US" }
      ])
    })

    it("returns 403 when non-admin tries to bulk update settings", async () => {
      const response = await request(app)
        .put("/settings/bulk")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ settings: [{ key: "timezone", value: "UTC" }] })

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
      expect(SettingService.updateSettingsBulk).not.toHaveBeenCalled()
    })
  })
})

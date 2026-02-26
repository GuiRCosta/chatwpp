import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("axios", () => {
  const mockPost = vi.fn()
  const mockGet = vi.fn()
  const mockInterceptors = {
    response: { use: vi.fn() }
  }
  const mockCreate = vi.fn().mockReturnValue({
    post: mockPost,
    get: mockGet,
    interceptors: mockInterceptors
  })

  return {
    default: {
      create: mockCreate,
      post: vi.fn(),
      get: vi.fn()
    }
  }
})

vi.mock("@/helpers/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

import axios from "axios"
import {
  sendTextMessage,
  sendMediaMessage,
  sendTemplateMessage,
  getMediaUrl,
  downloadMedia,
  markAsRead,
  exchangeCodeForToken,
  debugToken,
  getPhoneNumbers,
  subscribeApp
} from "../wabaClient"

function getMockClient() {
  const createFn = vi.mocked(axios.create)
  const client = createFn.mock.results[createFn.mock.results.length - 1]?.value
  return client as { post: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn> }
}

describe("wabaClient", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("sendTextMessage", () => {
    it("sends a text message successfully", async () => {
      const response = {
        messaging_product: "whatsapp",
        contacts: [{ input: "5511999999999", wa_id: "5511999999999" }],
        messages: [{ id: "wamid.123" }]
      }

      vi.mocked(axios.create).mockReturnValue({
        post: vi.fn().mockResolvedValue({ data: response }),
        get: vi.fn(),
        interceptors: { response: { use: vi.fn() } }
      } as any)

      const result = await sendTextMessage(
        "phone-123",
        "token-abc",
        "5511999999999",
        "Hello world"
      )

      expect(result).toEqual(response)

      const client = getMockClient()
      expect(client.post).toHaveBeenCalledWith("/phone-123/messages", {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "5511999999999",
        type: "text",
        text: {
          preview_url: false,
          body: "Hello world"
        }
      })
    })

    it("creates client with correct config", async () => {
      vi.mocked(axios.create).mockReturnValue({
        post: vi.fn().mockResolvedValue({ data: {} }),
        get: vi.fn(),
        interceptors: { response: { use: vi.fn() } }
      } as any)

      await sendTextMessage("phone-123", "my-token", "55119", "Hi")

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: "https://graph.facebook.com/v25.0",
          headers: expect.objectContaining({
            Authorization: "Bearer my-token"
          }),
          timeout: 30000
        })
      )
    })

    it("propagates API errors", async () => {
      const error = new Error("API error")
      vi.mocked(axios.create).mockReturnValue({
        post: vi.fn().mockRejectedValue(error),
        get: vi.fn(),
        interceptors: { response: { use: vi.fn() } }
      } as any)

      await expect(
        sendTextMessage("phone-123", "token", "55119", "Hi")
      ).rejects.toThrow("API error")
    })
  })

  describe("sendMediaMessage", () => {
    it("sends an image with caption", async () => {
      const response = { messages: [{ id: "wamid.456" }] }

      vi.mocked(axios.create).mockReturnValue({
        post: vi.fn().mockResolvedValue({ data: response }),
        get: vi.fn(),
        interceptors: { response: { use: vi.fn() } }
      } as any)

      const result = await sendMediaMessage(
        "phone-123",
        "token-abc",
        "5511999999999",
        "image",
        "https://example.com/image.jpg",
        "My photo"
      )

      expect(result).toEqual(response)

      const client = getMockClient()
      expect(client.post).toHaveBeenCalledWith("/phone-123/messages", {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "5511999999999",
        type: "image",
        image: {
          link: "https://example.com/image.jpg",
          caption: "My photo"
        }
      })
    })

    it("sends a document with filename", async () => {
      vi.mocked(axios.create).mockReturnValue({
        post: vi.fn().mockResolvedValue({ data: {} }),
        get: vi.fn(),
        interceptors: { response: { use: vi.fn() } }
      } as any)

      await sendMediaMessage(
        "phone-123",
        "token-abc",
        "5511999999999",
        "document",
        "https://example.com/file.pdf",
        "Invoice",
        "invoice.pdf"
      )

      const client = getMockClient()
      expect(client.post).toHaveBeenCalledWith("/phone-123/messages", {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "5511999999999",
        type: "document",
        document: {
          link: "https://example.com/file.pdf",
          caption: "Invoice",
          filename: "invoice.pdf"
        }
      })
    })

    it("does not include caption for audio", async () => {
      vi.mocked(axios.create).mockReturnValue({
        post: vi.fn().mockResolvedValue({ data: {} }),
        get: vi.fn(),
        interceptors: { response: { use: vi.fn() } }
      } as any)

      await sendMediaMessage(
        "phone-123",
        "token-abc",
        "5511999999999",
        "audio",
        "https://example.com/audio.mp3",
        "This caption should be ignored"
      )

      const client = getMockClient()
      expect(client.post).toHaveBeenCalledWith(
        "/phone-123/messages",
        expect.objectContaining({
          type: "audio",
          audio: { link: "https://example.com/audio.mp3" }
        })
      )
    })

    it("does not include filename for non-document types", async () => {
      vi.mocked(axios.create).mockReturnValue({
        post: vi.fn().mockResolvedValue({ data: {} }),
        get: vi.fn(),
        interceptors: { response: { use: vi.fn() } }
      } as any)

      await sendMediaMessage(
        "phone-123",
        "token-abc",
        "5511999999999",
        "video",
        "https://example.com/video.mp4",
        "My video",
        "video.mp4"
      )

      const client = getMockClient()
      const payload = client.post.mock.calls[0][1]
      expect(payload.video).toEqual({
        link: "https://example.com/video.mp4",
        caption: "My video"
      })
      expect(payload.video.filename).toBeUndefined()
    })
  })

  describe("sendTemplateMessage", () => {
    it("sends a template message without components", async () => {
      const response = { messages: [{ id: "wamid.789" }] }

      vi.mocked(axios.create).mockReturnValue({
        post: vi.fn().mockResolvedValue({ data: response }),
        get: vi.fn(),
        interceptors: { response: { use: vi.fn() } }
      } as any)

      const result = await sendTemplateMessage(
        "phone-123",
        "token-abc",
        "5511999999999",
        "hello_world",
        "en_US"
      )

      expect(result).toEqual(response)

      const client = getMockClient()
      expect(client.post).toHaveBeenCalledWith("/phone-123/messages", {
        messaging_product: "whatsapp",
        to: "5511999999999",
        type: "template",
        template: {
          name: "hello_world",
          language: { code: "en_US" }
        }
      })
    })

    it("sends a template message with components", async () => {
      vi.mocked(axios.create).mockReturnValue({
        post: vi.fn().mockResolvedValue({ data: {} }),
        get: vi.fn(),
        interceptors: { response: { use: vi.fn() } }
      } as any)

      const components = [
        { type: "body" as const, parameters: [{ type: "text" as const, text: "John" }] }
      ]

      await sendTemplateMessage(
        "phone-123",
        "token-abc",
        "5511999999999",
        "welcome",
        "pt_BR",
        components
      )

      const client = getMockClient()
      expect(client.post).toHaveBeenCalledWith(
        "/phone-123/messages",
        expect.objectContaining({
          template: expect.objectContaining({
            components
          })
        })
      )
    })
  })

  describe("getMediaUrl", () => {
    it("returns media URL info", async () => {
      const mediaResponse = {
        id: "media-123",
        messaging_product: "whatsapp",
        url: "https://lookaside.fbsbx.com/media123",
        mime_type: "image/jpeg",
        sha256: "abc",
        file_size: 12345
      }

      vi.mocked(axios.create).mockReturnValue({
        post: vi.fn(),
        get: vi.fn().mockResolvedValue({ data: mediaResponse }),
        interceptors: { response: { use: vi.fn() } }
      } as any)

      const result = await getMediaUrl("media-123", "token-abc")

      expect(result).toEqual(mediaResponse)

      const client = getMockClient()
      expect(client.get).toHaveBeenCalledWith("/media-123")
    })
  })

  describe("downloadMedia", () => {
    it("downloads media and returns a buffer", async () => {
      const mockData = Buffer.from("fake image data")

      vi.mocked(axios.get).mockResolvedValue({ data: mockData })

      const result = await downloadMedia(
        "https://lookaside.fbsbx.com/media123",
        "token-abc"
      )

      expect(Buffer.isBuffer(result)).toBe(true)
      expect(axios.get).toHaveBeenCalledWith(
        "https://lookaside.fbsbx.com/media123",
        {
          headers: { Authorization: "Bearer token-abc" },
          responseType: "arraybuffer",
          timeout: 60000
        }
      )
    })

    it("propagates download errors", async () => {
      vi.mocked(axios.get).mockRejectedValue(new Error("Network error"))

      await expect(
        downloadMedia("https://example.com/media", "token")
      ).rejects.toThrow("Network error")
    })
  })

  describe("markAsRead", () => {
    it("marks a message as read", async () => {
      vi.mocked(axios.create).mockReturnValue({
        post: vi.fn().mockResolvedValue({ data: { success: true } }),
        get: vi.fn(),
        interceptors: { response: { use: vi.fn() } }
      } as any)

      await markAsRead("phone-123", "token-abc", "wamid.456")

      const client = getMockClient()
      expect(client.post).toHaveBeenCalledWith("/phone-123/messages", {
        messaging_product: "whatsapp",
        status: "read",
        message_id: "wamid.456"
      })
    })
  })

  describe("exchangeCodeForToken", () => {
    const originalEnv = { ...process.env }

    beforeEach(() => {
      process.env.META_APP_ID = "app-123"
      process.env.META_APP_SECRET = "secret-456"
    })

    afterEach(() => {
      process.env = { ...originalEnv }
    })

    it("exchanges code for token successfully", async () => {
      vi.mocked(axios.post).mockResolvedValue({
        data: {
          access_token: "EAAtoken123",
          token_type: "bearer",
          expires_in: 5184000
        }
      })

      const result = await exchangeCodeForToken("auth-code-xyz")

      expect(result).toEqual({
        accessToken: "EAAtoken123",
        tokenType: "bearer",
        expiresIn: 5184000
      })

      expect(axios.post).toHaveBeenCalledWith(
        "https://graph.facebook.com/v25.0/oauth/access_token",
        expect.stringContaining("client_id=app-123"),
        expect.objectContaining({
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: 30000
        })
      )
    })

    it("throws when META_APP_ID is missing", async () => {
      delete process.env.META_APP_ID

      await expect(exchangeCodeForToken("code")).rejects.toThrow(
        "META_APP_ID and META_APP_SECRET must be configured"
      )
    })

    it("throws when META_APP_SECRET is missing", async () => {
      delete process.env.META_APP_SECRET

      await expect(exchangeCodeForToken("code")).rejects.toThrow(
        "META_APP_ID and META_APP_SECRET must be configured"
      )
    })
  })

  describe("debugToken", () => {
    const originalEnv = { ...process.env }

    beforeEach(() => {
      process.env.META_APP_ID = "app-123"
      process.env.META_APP_SECRET = "secret-456"
    })

    afterEach(() => {
      process.env = { ...originalEnv }
    })

    it("debugs a token successfully", async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: {
          data: {
            is_valid: true,
            app_id: "app-123",
            scopes: ["whatsapp_business_management", "whatsapp_business_messaging"],
            expires_at: 1700000000
          }
        }
      })

      const result = await debugToken("user-token")

      expect(result).toEqual({
        isValid: true,
        appId: "app-123",
        scopes: ["whatsapp_business_management", "whatsapp_business_messaging"],
        expiresAt: 1700000000
      })

      expect(axios.get).toHaveBeenCalledWith(
        "https://graph.facebook.com/v25.0/debug_token",
        {
          params: {
            input_token: "user-token",
            access_token: "app-123|secret-456"
          },
          timeout: 30000
        }
      )
    })

    it("returns empty scopes when none provided", async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: {
          data: {
            is_valid: false,
            app_id: "app-123",
            expires_at: 0
          }
        }
      })

      const result = await debugToken("expired-token")

      expect(result.scopes).toEqual([])
      expect(result.isValid).toBe(false)
    })

    it("throws when META_APP_ID is missing", async () => {
      delete process.env.META_APP_ID

      await expect(debugToken("token")).rejects.toThrow(
        "META_APP_ID and META_APP_SECRET must be configured"
      )
    })
  })

  describe("getPhoneNumbers", () => {
    it("returns mapped phone numbers", async () => {
      const apiResponse = {
        data: [
          {
            id: "phone-1",
            display_phone_number: "+55 11 99999-9999",
            verified_name: "My Business",
            quality_rating: "GREEN"
          },
          {
            id: "phone-2",
            display_phone_number: "+55 21 88888-8888",
            verified_name: "Other Business",
            quality_rating: "YELLOW"
          }
        ]
      }

      vi.mocked(axios.create).mockReturnValue({
        post: vi.fn(),
        get: vi.fn().mockResolvedValue({ data: apiResponse }),
        interceptors: { response: { use: vi.fn() } }
      } as any)

      const result = await getPhoneNumbers("waba-123", "token-abc")

      expect(result).toEqual([
        {
          id: "phone-1",
          displayPhoneNumber: "+55 11 99999-9999",
          verifiedName: "My Business",
          qualityRating: "GREEN"
        },
        {
          id: "phone-2",
          displayPhoneNumber: "+55 21 88888-8888",
          verifiedName: "Other Business",
          qualityRating: "YELLOW"
        }
      ])
    })

    it("returns empty array when no data", async () => {
      vi.mocked(axios.create).mockReturnValue({
        post: vi.fn(),
        get: vi.fn().mockResolvedValue({ data: {} }),
        interceptors: { response: { use: vi.fn() } }
      } as any)

      const result = await getPhoneNumbers("waba-123", "token-abc")

      expect(result).toEqual([])
    })
  })

  describe("subscribeApp", () => {
    it("subscribes to webhooks for a phone number", async () => {
      vi.mocked(axios.create).mockReturnValue({
        post: vi.fn().mockResolvedValue({ data: { success: true } }),
        get: vi.fn(),
        interceptors: { response: { use: vi.fn() } }
      } as any)

      await subscribeApp("phone-123", "token-abc")

      const client = getMockClient()
      expect(client.post).toHaveBeenCalledWith("/phone-123/subscribed_apps", {})
    })
  })
})

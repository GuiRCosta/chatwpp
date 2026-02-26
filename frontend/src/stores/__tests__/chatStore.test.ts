import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest"
import { server } from "@/__tests__/mocks/server"
import { resetAllStores } from "@/__tests__/utils/storeReset"
import { http, HttpResponse } from "msw"
import { useChatStore } from "@/stores/chatStore"
import type { Message } from "@/types"

vi.mock("@/lib/mediaUpload", () => ({
  uploadMedia: vi.fn()
}))

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => {
  server.resetHandlers()
  resetAllStores()
})
afterAll(() => server.close())

const createMessage = (overrides: Partial<Message> = {}): Message => ({
  id: 1,
  body: "Hello",
  fromMe: false,
  read: false,
  ack: 0,
  ticketId: 100,
  contactId: 10,
  tenantId: 1,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  ...overrides
})

describe("chatStore", () => {
  describe("initial state", () => {
    it("has empty messages array", () => {
      expect(useChatStore.getState().messages).toEqual([])
    })

    it("has isLoading set to false", () => {
      expect(useChatStore.getState().isLoading).toBe(false)
    })

    it("has hasMore set to false", () => {
      expect(useChatStore.getState().hasMore).toBe(false)
    })

    it("has page set to 1", () => {
      expect(useChatStore.getState().page).toBe(1)
    })

    it("has currentTicketId set to null", () => {
      expect(useChatStore.getState().currentTicketId).toBeNull()
    })
  })

  describe("fetchMessages", () => {
    it("populates messages reversed", async () => {
      const msg1 = createMessage({ id: 1, body: "Newer" })
      const msg2 = createMessage({ id: 2, body: "Older" })

      server.use(
        http.get("/api/messages/:ticketId", () => {
          return HttpResponse.json({
            success: true,
            data: {
              messages: [msg1, msg2],
              count: 2,
              hasMore: false
            }
          })
        })
      )

      await useChatStore.getState().fetchMessages(100)

      const state = useChatStore.getState()
      // Messages are reversed for display
      expect(state.messages[0].body).toBe("Older")
      expect(state.messages[1].body).toBe("Newer")
      expect(state.isLoading).toBe(false)
    })

    it("sets currentTicketId", async () => {
      await useChatStore.getState().fetchMessages(42)

      expect(useChatStore.getState().currentTicketId).toBe(42)
    })

    it("sets hasMore from response", async () => {
      server.use(
        http.get("/api/messages/:ticketId", () => {
          return HttpResponse.json({
            success: true,
            data: {
              messages: [createMessage()],
              count: 1,
              hasMore: true
            }
          })
        })
      )

      await useChatStore.getState().fetchMessages(100)

      expect(useChatStore.getState().hasMore).toBe(true)
    })
  })

  describe("loadMoreMessages", () => {
    it("prepends older messages", async () => {
      const existingMsg = createMessage({ id: 1, body: "Existing" })
      const olderMsg = createMessage({ id: 2, body: "Older" })

      useChatStore.setState({
        messages: [existingMsg],
        hasMore: true,
        page: 1,
        currentTicketId: 100,
        isLoading: false
      })

      server.use(
        http.get("/api/messages/:ticketId", () => {
          return HttpResponse.json({
            success: true,
            data: {
              messages: [olderMsg],
              count: 1,
              hasMore: false
            }
          })
        })
      )

      await useChatStore.getState().loadMoreMessages(100)

      const state = useChatStore.getState()
      expect(state.messages).toHaveLength(2)
      // Older messages prepended (reversed then prepended)
      expect(state.messages[0].body).toBe("Older")
      expect(state.messages[1].body).toBe("Existing")
      expect(state.page).toBe(2)
    })

    it("does nothing when hasMore is false", async () => {
      useChatStore.setState({
        messages: [createMessage()],
        hasMore: false,
        page: 1,
        currentTicketId: 100,
        isLoading: false
      })

      await useChatStore.getState().loadMoreMessages(100)

      expect(useChatStore.getState().messages).toHaveLength(1)
      expect(useChatStore.getState().page).toBe(1)
    })

    it("does nothing when isLoading is true", async () => {
      useChatStore.setState({
        messages: [createMessage()],
        hasMore: true,
        page: 1,
        currentTicketId: 100,
        isLoading: true
      })

      await useChatStore.getState().loadMoreMessages(100)

      expect(useChatStore.getState().page).toBe(1)
    })
  })

  describe("sendMessage", () => {
    it("appends message from response", async () => {
      useChatStore.setState({
        messages: [],
        currentTicketId: 1
      })

      await useChatStore.getState().sendMessage(1, "Hello world")

      const state = useChatStore.getState()
      expect(state.messages).toHaveLength(1)
      expect(state.messages[0].body).toBe("Hello world")
      expect(state.messages[0].fromMe).toBe(true)
    })
  })

  describe("addMessage", () => {
    it("adds message to current ticket", () => {
      useChatStore.setState({
        messages: [createMessage({ id: 1 })],
        currentTicketId: 100
      })

      const newMessage = createMessage({ id: 2, body: "New", ticketId: 100 })

      useChatStore.getState().addMessage(newMessage)

      const state = useChatStore.getState()
      expect(state.messages).toHaveLength(2)
      expect(state.messages[1].body).toBe("New")
    })

    it("deduplicates messages with same id", () => {
      const existingMsg = createMessage({ id: 1, body: "Existing", ticketId: 100 })
      useChatStore.setState({
        messages: [existingMsg],
        currentTicketId: 100
      })

      const duplicate = createMessage({ id: 1, body: "Duplicate", ticketId: 100 })

      useChatStore.getState().addMessage(duplicate)

      expect(useChatStore.getState().messages).toHaveLength(1)
      expect(useChatStore.getState().messages[0].body).toBe("Existing")
    })

    it("ignores message for different ticket", () => {
      useChatStore.setState({
        messages: [createMessage({ id: 1, ticketId: 100 })],
        currentTicketId: 100
      })

      const differentTicketMsg = createMessage({ id: 2, ticketId: 999 })

      useChatStore.getState().addMessage(differentTicketMsg)

      expect(useChatStore.getState().messages).toHaveLength(1)
    })
  })

  describe("sendAudioMessage", () => {
    it("uploads audio and sends message with mediaUrl", async () => {
      const { uploadMedia } = await import("@/lib/mediaUpload")
      vi.mocked(uploadMedia).mockResolvedValue({
        mediaUrl: "1/abc123.ogg",
        mediaType: "audio",
        originalName: "audio_123.ogg",
        mimeType: "audio/ogg",
        size: 5000
      })

      let messageSent: Record<string, unknown> = {}
      server.use(
        http.post("/api/messages/:ticketId", async ({ request }) => {
          messageSent = (await request.json()) as Record<string, unknown>
          return HttpResponse.json({
            success: true,
            data: createMessage({
              id: 99,
              body: "",
              mediaUrl: "1/abc123.ogg",
              mediaType: "audio",
              fromMe: true,
              ticketId: 1
            })
          })
        })
      )

      useChatStore.setState({
        messages: [],
        currentTicketId: 1
      })

      const blob = new Blob(["fake-audio"], { type: "audio/ogg" })
      await useChatStore.getState().sendAudioMessage(1, blob, "audio/ogg;codecs=opus", 5)

      expect(uploadMedia).toHaveBeenCalledWith(blob, expect.stringMatching(/^audio_\d+\.ogg$/))
      expect(messageSent.mediaUrl).toBe("1/abc123.ogg")
      expect(messageSent.mediaType).toBe("audio")

      const state = useChatStore.getState()
      expect(state.messages).toHaveLength(1)
      expect(state.messages[0].mediaType).toBe("audio")
    })
  })

  describe("clearMessages", () => {
    it("resets state", () => {
      useChatStore.setState({
        messages: [createMessage()],
        page: 3,
        hasMore: true,
        currentTicketId: 100
      })

      useChatStore.getState().clearMessages()

      const state = useChatStore.getState()
      expect(state.messages).toEqual([])
      expect(state.page).toBe(1)
      expect(state.hasMore).toBe(false)
      expect(state.currentTicketId).toBeNull()
    })
  })
})

import { create } from "zustand"
import api from "@/lib/api"
import { uploadMedia } from "@/lib/mediaUpload"
import { getExtensionFromMime } from "@/lib/audio"
import type { Message, ApiResponse } from "@/types"

interface ChatState {
  messages: Message[]
  isLoading: boolean
  hasMore: boolean
  page: number
  currentTicketId: number | null
  fetchMessages: (ticketId: number) => Promise<void>
  loadMoreMessages: (ticketId: number) => Promise<void>
  sendMessage: (ticketId: number, body: string, mediaUrl?: string, mediaType?: string) => Promise<void>
  sendAudioMessage: (ticketId: number, blob: Blob, mimeType: string, duration: number) => Promise<void>
  addMessage: (message: Message) => void
  clearMessages: () => void
  markAsRead: (ticketId: number) => Promise<void>
}

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: [],
  isLoading: false,
  hasMore: false,
  page: 1,
  currentTicketId: null,

  fetchMessages: async (ticketId: number) => {
    try {
      set({ isLoading: true, currentTicketId: ticketId, page: 1 })

      const response = await api.get<
        ApiResponse<{
          messages: Message[]
          count: number
          hasMore: boolean
        }>
      >(`/messages/${ticketId}`, {
        params: {
          pageNumber: 1,
          limit: 50
        }
      })

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch messages")
      }

      // Messages come in reverse chronological order, reverse them for display
      const messages = [...response.data.data.messages].reverse()

      set({
        messages,
        hasMore: response.data.data.hasMore,
        isLoading: false
      })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  loadMoreMessages: async (ticketId: number) => {
    try {
      const { page, hasMore, isLoading } = get()

      if (!hasMore || isLoading) {
        return
      }

      set({ isLoading: true })

      const nextPage = page + 1

      const response = await api.get<
        ApiResponse<{
          messages: Message[]
          count: number
          hasMore: boolean
        }>
      >(`/messages/${ticketId}`, {
        params: {
          pageNumber: nextPage,
          limit: 50
        }
      })

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to load more messages")
      }

      // Messages come in reverse chronological order, reverse them for display
      const newMessages = [...response.data.data.messages].reverse()

      set((state) => ({
        messages: [...newMessages, ...state.messages],
        hasMore: response.data.data.hasMore,
        page: nextPage,
        isLoading: false
      }))
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  sendMessage: async (ticketId: number, body: string, mediaUrl?: string, mediaType?: string) => {
    const payload: {
      body: string
      mediaUrl?: string
      mediaType?: string
    } = { body }

    if (mediaUrl) {
      payload.mediaUrl = mediaUrl
    }

    if (mediaType) {
      payload.mediaType = mediaType
    }

    const response = await api.post<ApiResponse<Message>>(
      `/messages/${ticketId}`,
      payload
    )

    if (!response.data.success) {
      throw new Error(response.data.error || "Failed to send message")
    }

    // Message will be added via socket event or optimistically
    set((state) => ({
      messages: [...state.messages, response.data.data]
    }))
  },

  sendAudioMessage: async (ticketId: number, blob: Blob, mimeType: string, _duration: number) => {
    const ext = getExtensionFromMime(mimeType)
    const filename = `audio_${Date.now()}.${ext}`

    const { mediaUrl, mediaType } = await uploadMedia(blob, filename)
    await get().sendMessage(ticketId, "", mediaUrl, mediaType)
  },

  addMessage: (message: Message) => {
    set((state) => {
      // Only add if message doesn't already exist (prevent duplicates)
      const exists = state.messages.some((m) => m.id === message.id)

      if (exists) {
        return state
      }

      // Only add message if it belongs to current ticket
      if (state.currentTicketId !== message.ticketId) {
        return state
      }

      return {
        messages: [...state.messages, message]
      }
    })
  },

  clearMessages: () => {
    set({
      messages: [],
      page: 1,
      hasMore: false,
      currentTicketId: null
    })
  },

  markAsRead: async (ticketId: number) => {
    await api.put(`/messages/${ticketId}/read`)
  }
}))

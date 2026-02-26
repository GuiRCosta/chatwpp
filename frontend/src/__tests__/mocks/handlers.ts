import { http, HttpResponse } from "msw"

export const handlers = [
  // Auth
  http.post("/api/auth/login", () => {
    return HttpResponse.json({
      success: true,
      data: {
        token: "test-jwt-token",
        refreshToken: "test-refresh-token",
        user: {
          id: 1,
          tenantId: 1,
          name: "Test User",
          email: "test@example.com",
          profile: "admin",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z"
        }
      }
    })
  }),

  http.post("/api/auth/logout", () => {
    return HttpResponse.json({ success: true })
  }),

  http.post("/api/auth/refresh", () => {
    return HttpResponse.json({
      success: true,
      data: {
        token: "new-test-jwt-token",
        refreshToken: "new-test-refresh-token"
      }
    })
  }),

  // Tickets
  http.get("/api/tickets", () => {
    return HttpResponse.json({
      success: true,
      data: { tickets: [], count: 0, hasMore: false }
    })
  }),

  // Messages
  http.get("/api/messages/:ticketId", () => {
    return HttpResponse.json({
      success: true,
      data: { messages: [], count: 0, hasMore: false }
    })
  }),

  http.post("/api/messages/:ticketId", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({
      success: true,
      data: {
        id: Date.now(),
        body: body.body,
        fromMe: true,
        read: false,
        ack: 0,
        ticketId: 1,
        contactId: 1,
        tenantId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    })
  }),

  http.put("/api/messages/:ticketId/read", () => {
    return HttpResponse.json({ success: true })
  }),

  // Contacts
  http.get("/api/contacts", () => {
    return HttpResponse.json({
      success: true,
      data: [],
      meta: { total: 0, page: 1, limit: 20, hasMore: false }
    })
  }),

  // Notifications
  http.get("/api/notifications", () => {
    return HttpResponse.json({
      success: true,
      data: [],
      meta: { total: 0, page: 1, limit: 20, hasMore: false }
    })
  }),

  http.patch("/api/notifications/:id/read", ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        id: Number(params.id),
        title: "Test",
        message: "Test notification",
        isRead: true,
        userId: 1,
        tenantId: 1,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: new Date().toISOString()
      }
    })
  }),

  http.patch("/api/notifications/read-all", () => {
    return HttpResponse.json({
      success: true,
      data: { count: 0 }
    })
  }),

  // Dashboard stats
  http.get("/api/tickets", ({ request }) => {
    const url = new URL(request.url)
    if (url.searchParams.has("status")) {
      return HttpResponse.json({
        success: true,
        data: { tickets: [], count: 0, hasMore: false }
      })
    }
    return HttpResponse.json({
      success: true,
      data: { tickets: [], count: 0, hasMore: false }
    })
  }),

  http.get("/api/contacts", () => {
    return HttpResponse.json({
      success: true,
      data: [],
      meta: { total: 0, page: 1, limit: 20, hasMore: false }
    })
  }),

  http.get("/api/campaigns", () => {
    return HttpResponse.json({
      success: true,
      data: [],
      meta: { total: 0, page: 1, limit: 20, hasMore: false }
    })
  }),

  http.get("/api/opportunities", () => {
    return HttpResponse.json({
      success: true,
      data: [],
      meta: { total: 0, page: 1, limit: 20, hasMore: false }
    })
  })
]

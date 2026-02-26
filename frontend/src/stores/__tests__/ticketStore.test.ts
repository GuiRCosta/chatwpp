import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest"
import { server } from "@/__tests__/mocks/server"
import { resetAllStores } from "@/__tests__/utils/storeReset"
import { http, HttpResponse } from "msw"
import { useTicketStore } from "@/stores/ticketStore"
import type { Ticket } from "@/types"

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => {
  server.resetHandlers()
  resetAllStores()
})
afterAll(() => server.close())

const mockTicket: Ticket = {
  id: 1,
  status: "open",
  lastMessage: "Hello",
  contactId: 10,
  tenantId: 1,
  unreadMessages: 2,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
}

const mockTicket2: Ticket = {
  id: 2,
  status: "pending",
  lastMessage: "World",
  contactId: 20,
  tenantId: 1,
  unreadMessages: 0,
  createdAt: "2024-01-02T00:00:00.000Z",
  updatedAt: "2024-01-02T00:00:00.000Z"
}

describe("ticketStore", () => {
  describe("initial state", () => {
    it("has empty tickets array", () => {
      expect(useTicketStore.getState().tickets).toEqual([])
    })

    it("has selectedTicket set to null", () => {
      expect(useTicketStore.getState().selectedTicket).toBeNull()
    })

    it("has isLoading set to false", () => {
      expect(useTicketStore.getState().isLoading).toBe(false)
    })

    it("has filter set to 'open'", () => {
      expect(useTicketStore.getState().filter).toBe("open")
    })

    it("has searchParam set to empty string", () => {
      expect(useTicketStore.getState().searchParam).toBe("")
    })
  })

  describe("fetchTickets", () => {
    it("populates tickets array", async () => {
      server.use(
        http.get("/api/tickets", () => {
          return HttpResponse.json({
            success: true,
            data: {
              tickets: [mockTicket, mockTicket2],
              count: 2,
              hasMore: false
            }
          })
        })
      )

      await useTicketStore.getState().fetchTickets()

      const state = useTicketStore.getState()
      expect(state.tickets).toHaveLength(2)
      expect(state.tickets[0].id).toBe(1)
      expect(state.tickets[1].id).toBe(2)
      expect(state.isLoading).toBe(false)
    })

    it("sends filter params when filter is not 'all'", async () => {
      let capturedUrl = ""
      server.use(
        http.get("/api/tickets", ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json({
            success: true,
            data: { tickets: [], count: 0, hasMore: false }
          })
        })
      )

      useTicketStore.setState({ filter: "pending" })
      await useTicketStore.getState().fetchTickets()

      const url = new URL(capturedUrl)
      expect(url.searchParams.get("status")).toBe("pending")
    })

    it("does not send status param when filter is 'all'", async () => {
      let capturedUrl = ""
      server.use(
        http.get("/api/tickets", ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json({
            success: true,
            data: { tickets: [], count: 0, hasMore: false }
          })
        })
      )

      useTicketStore.setState({ filter: "all" })
      await useTicketStore.getState().fetchTickets()

      const url = new URL(capturedUrl)
      expect(url.searchParams.has("status")).toBe(false)
    })

    it("sends search param when searchParam is set", async () => {
      let capturedUrl = ""
      server.use(
        http.get("/api/tickets", ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json({
            success: true,
            data: { tickets: [], count: 0, hasMore: false }
          })
        })
      )

      useTicketStore.setState({ searchParam: "customer" })
      await useTicketStore.getState().fetchTickets()

      const url = new URL(capturedUrl)
      expect(url.searchParams.get("search")).toBe("customer")
    })
  })

  describe("selectTicket", () => {
    it("updates selectedTicket", () => {
      useTicketStore.getState().selectTicket(mockTicket)

      expect(useTicketStore.getState().selectedTicket).toEqual(mockTicket)
    })
  })

  describe("setFilter", () => {
    it("updates filter value", () => {
      server.use(
        http.get("/api/tickets", () => {
          return HttpResponse.json({
            success: true,
            data: { tickets: [], count: 0, hasMore: false }
          })
        })
      )

      useTicketStore.getState().setFilter("closed")

      expect(useTicketStore.getState().filter).toBe("closed")
    })
  })

  describe("setSearchParam", () => {
    it("updates searchParam", () => {
      useTicketStore.getState().setSearchParam("test query")

      expect(useTicketStore.getState().searchParam).toBe("test query")
    })
  })

  describe("updateTicket", () => {
    it("replaces ticket in array immutably", () => {
      useTicketStore.setState({ tickets: [mockTicket, mockTicket2] })

      const originalTickets = useTicketStore.getState().tickets

      const updatedTicket: Ticket = {
        ...mockTicket,
        status: "closed",
        lastMessage: "Updated"
      }

      useTicketStore.getState().updateTicket(updatedTicket)

      const state = useTicketStore.getState()
      expect(state.tickets).not.toBe(originalTickets)
      expect(state.tickets[0].status).toBe("closed")
      expect(state.tickets[0].lastMessage).toBe("Updated")
      expect(state.tickets[1]).toEqual(mockTicket2)
    })

    it("updates selectedTicket if matching", () => {
      useTicketStore.setState({
        tickets: [mockTicket],
        selectedTicket: mockTicket
      })

      const updatedTicket: Ticket = {
        ...mockTicket,
        status: "closed"
      }

      useTicketStore.getState().updateTicket(updatedTicket)

      expect(useTicketStore.getState().selectedTicket?.status).toBe("closed")
    })

    it("does not update selectedTicket if not matching", () => {
      useTicketStore.setState({
        tickets: [mockTicket, mockTicket2],
        selectedTicket: mockTicket2
      })

      const updatedTicket: Ticket = {
        ...mockTicket,
        status: "closed"
      }

      useTicketStore.getState().updateTicket(updatedTicket)

      expect(useTicketStore.getState().selectedTicket).toEqual(mockTicket2)
    })
  })

  describe("clearSelection", () => {
    it("sets selectedTicket to null", () => {
      useTicketStore.setState({ selectedTicket: mockTicket })

      useTicketStore.getState().clearSelection()

      expect(useTicketStore.getState().selectedTicket).toBeNull()
    })
  })
})

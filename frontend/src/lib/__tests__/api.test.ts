import { describe, it, expect, vi, beforeEach, beforeAll, afterAll, afterEach } from "vitest"
import { http, HttpResponse } from "msw"
import { server } from "@/__tests__/mocks/server"
import api from "@/lib/api"

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }))
afterEach(() => {
  server.resetHandlers()
  vi.mocked(localStorage.getItem).mockReset()
  vi.mocked(localStorage.setItem).mockReset()
  vi.mocked(localStorage.removeItem).mockReset()
  window.location.href = "http://localhost:7564"
})
afterAll(() => server.close())

describe("api", () => {
  describe("request interceptor", () => {
    it("adds Bearer token from localStorage when token exists", async () => {
      let capturedAuth = ""

      vi.mocked(localStorage.getItem).mockImplementation((key: string) => {
        if (key === "zflow:token") return "my-jwt-token"
        return null
      })

      server.use(
        http.get("/api/test-auth", ({ request }) => {
          capturedAuth = request.headers.get("Authorization") || ""
          return HttpResponse.json({ success: true, data: null })
        })
      )

      await api.get("/test-auth")

      expect(capturedAuth).toBe("Bearer my-jwt-token")
    })

    it("does not add Authorization header when no token exists", async () => {
      let capturedAuth: string | null = ""

      vi.mocked(localStorage.getItem).mockReturnValue(null)

      server.use(
        http.get("/api/test-no-auth", ({ request }) => {
          capturedAuth = request.headers.get("Authorization")
          return HttpResponse.json({ success: true, data: null })
        })
      )

      await api.get("/test-no-auth")

      expect(capturedAuth).toBeNull()
    })
  })

  describe("response interceptor", () => {
    it("on 401, attempts refresh and retries original request", async () => {
      let attempt = 0

      vi.mocked(localStorage.getItem).mockImplementation((key: string) => {
        if (key === "zflow:token") return "expired-token"
        if (key === "zflow:refreshToken") return "valid-refresh-token"
        return null
      })

      server.use(
        http.get("/api/protected-resource", () => {
          attempt += 1
          if (attempt === 1) {
            return HttpResponse.json(
              { success: false, error: "Unauthorized" },
              { status: 401 }
            )
          }
          return HttpResponse.json({
            success: true,
            data: { value: "protected-data" }
          })
        }),
        http.post("/api/auth/refresh", () => {
          return HttpResponse.json({
            success: true,
            data: {
              token: "new-jwt-token",
              refreshToken: "new-refresh-token"
            }
          })
        })
      )

      const response = await api.get("/protected-resource")

      expect(response.data.success).toBe(true)
      expect(response.data.data.value).toBe("protected-data")
      expect(localStorage.setItem).toHaveBeenCalledWith("zflow:token", "new-jwt-token")
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "zflow:refreshToken",
        "new-refresh-token"
      )
    })

    it("on refresh failure, clears tokens and redirects to /login", async () => {
      vi.mocked(localStorage.getItem).mockImplementation((key: string) => {
        if (key === "zflow:token") return "expired-token"
        if (key === "zflow:refreshToken") return "invalid-refresh-token"
        return null
      })

      server.use(
        http.get("/api/secure-endpoint", () => {
          return HttpResponse.json(
            { success: false, error: "Unauthorized" },
            { status: 401 }
          )
        }),
        http.post("/api/auth/refresh", () => {
          return HttpResponse.json(
            { success: false, error: "Invalid refresh token" },
            { status: 401 }
          )
        })
      )

      await expect(api.get("/secure-endpoint")).rejects.toThrow()

      expect(localStorage.removeItem).toHaveBeenCalledWith("zflow:token")
      expect(localStorage.removeItem).toHaveBeenCalledWith("zflow:refreshToken")
      expect(localStorage.removeItem).toHaveBeenCalledWith("zflow:user")
      expect(window.location.href).toBe("/login")
    })

    it("on 401 without refresh token, clears tokens and redirects to /login", async () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null)

      server.use(
        http.get("/api/no-refresh", () => {
          return HttpResponse.json(
            { success: false, error: "Unauthorized" },
            { status: 401 }
          )
        })
      )

      await expect(api.get("/no-refresh")).rejects.toThrow()

      expect(localStorage.removeItem).toHaveBeenCalledWith("zflow:token")
      expect(localStorage.removeItem).toHaveBeenCalledWith("zflow:refreshToken")
      expect(localStorage.removeItem).toHaveBeenCalledWith("zflow:user")
      expect(window.location.href).toBe("/login")
    })

    it("passes through non-401 errors without refresh attempt", async () => {
      server.use(
        http.get("/api/server-error", () => {
          return HttpResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
          )
        })
      )

      await expect(api.get("/server-error")).rejects.toThrow()

      expect(localStorage.removeItem).not.toHaveBeenCalled()
    })
  })
})

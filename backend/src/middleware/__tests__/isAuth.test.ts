import { describe, it, expect, vi } from "vitest"
import jwt from "jsonwebtoken"
import { isAuth, isAdmin, isSuperAdmin } from "../isAuth"
import { AppError } from "@/helpers/AppError"
import authConfig from "@/config/auth"
import {
  createMockRequest,
  createMockResponse,
  createTestToken
} from "@/__tests__/helpers"

describe("isAuth", () => {
  const mockNext = vi.fn()
  const mockRes = createMockResponse()

  it("throws 401 when no authorization header is present", () => {
    const req = createMockRequest({ headers: {} })

    expect(() => isAuth(req as any, mockRes as any, mockNext)).toThrow(AppError)
    expect(() => isAuth(req as any, mockRes as any, mockNext)).toThrow(
      "Token not provided"
    )
  })

  it("throws 401 when authorization header has no Bearer scheme", () => {
    const req = createMockRequest({
      headers: { authorization: "Basic some-token" }
    })

    expect(() => isAuth(req as any, mockRes as any, mockNext)).toThrow(AppError)
    expect(() => isAuth(req as any, mockRes as any, mockNext)).toThrow(
      "Token malformatted"
    )
  })

  it("throws 401 when Bearer has no token", () => {
    const req = createMockRequest({
      headers: { authorization: "Bearer" }
    })

    expect(() => isAuth(req as any, mockRes as any, mockNext)).toThrow(AppError)
    expect(() => isAuth(req as any, mockRes as any, mockNext)).toThrow(
      "Token malformatted"
    )
  })

  it("throws 401 when token is invalid", () => {
    const req = createMockRequest({
      headers: { authorization: "Bearer invalid-token" }
    })

    expect(() => isAuth(req as any, mockRes as any, mockNext)).toThrow(AppError)
    expect(() => isAuth(req as any, mockRes as any, mockNext)).toThrow(
      "Invalid or expired token"
    )
  })

  it("throws 401 when token is expired", () => {
    const expiredToken = jwt.sign(
      { id: 1, tenantId: 1, profile: "admin" },
      authConfig.secret,
      { expiresIn: "0s" }
    )

    const req = createMockRequest({
      headers: { authorization: `Bearer ${expiredToken}` }
    })

    expect(() => isAuth(req as any, mockRes as any, mockNext)).toThrow(AppError)
    expect(() => isAuth(req as any, mockRes as any, mockNext)).toThrow(
      "Invalid or expired token"
    )
  })

  it("sets userId, tenantId and userProfile on req for valid token", () => {
    const token = createTestToken({
      id: 42,
      tenantId: 7,
      profile: "super"
    })

    const req = createMockRequest({
      headers: { authorization: `Bearer ${token}` }
    })

    isAuth(req as any, mockRes as any, mockNext)

    expect(req.userId).toBe(42)
    expect(req.tenantId).toBe(7)
    expect(req.userProfile).toBe("super")
    expect(mockNext).toHaveBeenCalled()
  })

  it("calls next() on successful authentication", () => {
    const next = vi.fn()
    const token = createTestToken()
    const req = createMockRequest({
      headers: { authorization: `Bearer ${token}` }
    })

    isAuth(req as any, mockRes as any, next)

    expect(next).toHaveBeenCalledTimes(1)
  })
})

describe("isAdmin", () => {
  const mockRes = createMockResponse()

  it("calls next() when userProfile is admin", () => {
    const next = vi.fn()
    const req = createMockRequest({ userProfile: "admin" })

    isAdmin(req as any, mockRes as any, next)

    expect(next).toHaveBeenCalledTimes(1)
  })

  it("calls next() when userProfile is superadmin", () => {
    const next = vi.fn()
    const req = createMockRequest({ userProfile: "superadmin" })

    isAdmin(req as any, mockRes as any, next)

    expect(next).toHaveBeenCalledTimes(1)
  })

  it("throws 403 when userProfile is user", () => {
    const next = vi.fn()
    const req = createMockRequest({ userProfile: "user" })

    expect(() => isAdmin(req as any, mockRes as any, next)).toThrow(AppError)
    expect(() => isAdmin(req as any, mockRes as any, next)).toThrow(
      "Access denied. Admin privileges required."
    )
  })

  it("throws 403 when userProfile is super", () => {
    const next = vi.fn()
    const req = createMockRequest({ userProfile: "super" })

    expect(() => isAdmin(req as any, mockRes as any, next)).toThrow(AppError)
  })
})

describe("isSuperAdmin", () => {
  const mockRes = createMockResponse()

  it("calls next() when userProfile is superadmin", () => {
    const next = vi.fn()
    const req = createMockRequest({ userProfile: "superadmin" })

    isSuperAdmin(req as any, mockRes as any, next)

    expect(next).toHaveBeenCalledTimes(1)
  })

  it("throws 403 when userProfile is admin", () => {
    const next = vi.fn()
    const req = createMockRequest({ userProfile: "admin" })

    expect(() => isSuperAdmin(req as any, mockRes as any, next)).toThrow(
      AppError
    )
    expect(() => isSuperAdmin(req as any, mockRes as any, next)).toThrow(
      "Access denied. Super admin privileges required."
    )
  })

  it("throws 403 when userProfile is user", () => {
    const next = vi.fn()
    const req = createMockRequest({ userProfile: "user" })

    expect(() => isSuperAdmin(req as any, mockRes as any, next)).toThrow(
      AppError
    )
  })
})

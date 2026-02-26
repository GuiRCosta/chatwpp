import { describe, it, expect, vi } from "vitest"
import { errorHandler } from "../errorHandler"
import { AppError } from "@/helpers/AppError"
import { createMockRequest, createMockResponse } from "@/__tests__/helpers"

describe("errorHandler", () => {
  const mockReq = createMockRequest()
  const mockNext = vi.fn()

  it("returns correct status and message for AppError", () => {
    const res = createMockResponse()
    const error = new AppError("Not Found", 404)

    errorHandler(error, mockReq as any, res as any, mockNext)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Not Found"
    })
  })

  it("returns 400 for AppError with default statusCode", () => {
    const res = createMockResponse()
    const error = new AppError("Bad request")

    errorHandler(error, mockReq as any, res as any, mockNext)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Bad request"
    })
  })

  it("returns 401 for AppError with statusCode 401", () => {
    const res = createMockResponse()
    const error = new AppError("Unauthorized", 401)

    errorHandler(error, mockReq as any, res as any, mockNext)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Unauthorized"
    })
  })

  it("returns 500 and generic message for unknown Error", () => {
    const res = createMockResponse()
    const error = new Error("Some unexpected failure")

    errorHandler(error, mockReq as any, res as any, mockNext)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Internal server error"
    })
  })

  it("returns 500 for TypeError", () => {
    const res = createMockResponse()
    const error = new TypeError("Cannot read properties of undefined")

    errorHandler(error, mockReq as any, res as any, mockNext)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Internal server error"
    })
  })

  it("does not leak internal error details in the response", () => {
    const res = createMockResponse()
    const error = new Error("Database connection failed: password=secret123")

    errorHandler(error, mockReq as any, res as any, mockNext)

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Internal server error"
    })
  })
})

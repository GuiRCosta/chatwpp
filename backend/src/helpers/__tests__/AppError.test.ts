import { describe, it, expect } from "vitest"
import { AppError } from "../AppError"

describe("AppError", () => {
  it("creates an error with message and default statusCode 400", () => {
    const error = new AppError("Something went wrong")
    expect(error.message).toBe("Something went wrong")
    expect(error.statusCode).toBe(400)
  })

  it("creates an error with a custom statusCode", () => {
    const error = new AppError("Not Found", 404)
    expect(error.message).toBe("Not Found")
    expect(error.statusCode).toBe(404)
  })

  it("creates an error with statusCode 401", () => {
    const error = new AppError("Unauthorized", 401)
    expect(error.statusCode).toBe(401)
  })

  it("creates an error with statusCode 500", () => {
    const error = new AppError("Internal error", 500)
    expect(error.statusCode).toBe(500)
  })

  it("extends the native Error class", () => {
    const error = new AppError("test")
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(AppError)
  })

  it("is catchable as an Error", () => {
    try {
      throw new AppError("Thrown error", 422)
    } catch (err) {
      expect(err).toBeInstanceOf(AppError)
      expect((err as AppError).statusCode).toBe(422)
      expect((err as AppError).message).toBe("Thrown error")
    }
  })

  it("has a readonly statusCode property", () => {
    const error = new AppError("test", 403)
    expect(error.statusCode).toBe(403)
  })

  it("preserves prototype chain via Object.setPrototypeOf", () => {
    const error = new AppError("proto test")
    expect(Object.getPrototypeOf(error)).toBe(AppError.prototype)
  })
})

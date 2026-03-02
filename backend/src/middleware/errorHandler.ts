import { Request, Response, NextFunction } from "express"
import { AppError } from "../helpers/AppError"
import { logger } from "../helpers/logger"

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  if (err instanceof AppError) {
    logger.warn(`AppError: ${err.message} (${err.statusCode})`)
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    })
  }

  const seqErr = err as Error & {
    original?: { message: string; code?: string; detail?: string }
    sql?: string
  }

  if (seqErr.original) {
    logger.error(
      `Database error: ${seqErr.original.message} [code=${seqErr.original.code}] detail=${seqErr.original.detail || "none"} sql=${seqErr.sql || "unknown"}`
    )
  } else {
    logger.error(`Unexpected error: ${err.message} - ${err.stack}`)
  }

  return res.status(500).json({
    success: false,
    error: "Internal server error"
  })
}

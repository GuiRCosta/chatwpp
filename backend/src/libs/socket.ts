import { Server as SocketIO } from "socket.io"
import { Server as HttpServer } from "http"
import { verify } from "jsonwebtoken"
import authConfig from "../config/auth"
import { logger } from "../helpers/logger"

let io: SocketIO

interface TokenPayload {
  id: number
  tenantId: number
  profile: string
}

export function initSocket(httpServer: HttpServer): SocketIO {
  io = new SocketIO(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:7564",
      credentials: true
    },
    transports: ["polling", "websocket"],
    pingTimeout: 60000,
    pingInterval: 25000
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token

    if (!token) {
      return next(new Error("Authentication error: Token required"))
    }

    try {
      const decoded = verify(
        String(token),
        authConfig.secret
      ) as TokenPayload

      socket.data = {
        userId: decoded.id,
        tenantId: decoded.tenantId,
        profile: decoded.profile
      }

      return next()
    } catch {
      return next(new Error("Authentication error: Invalid token"))
    }
  })

  io.on("connection", (socket) => {
    const { tenantId, userId } = socket.data

    logger.info(`Socket connected: user=${userId} tenant=${tenantId}`)

    socket.join(`tenant:${tenantId}`)
    socket.join(`user:${userId}`)

    socket.on("joinTicket", (ticketId: number) => {
      socket.join(`ticket:${ticketId}`)
    })

    socket.on("leaveTicket", (ticketId: number) => {
      socket.leave(`ticket:${ticketId}`)
    })

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: user=${userId}`)
    })
  })

  return io
}

export function getIO(): SocketIO {
  if (!io) {
    throw new Error("Socket.io not initialized")
  }
  return io
}

export function emitToTenant(tenantId: number, event: string, data: unknown): void {
  getIO().to(`tenant:${tenantId}`).emit(event, data)
}

export function emitToUser(userId: number, event: string, data: unknown): void {
  getIO().to(`user:${userId}`).emit(event, data)
}

export function emitToTicket(ticketId: number, event: string, data: unknown): void {
  getIO().to(`ticket:${ticketId}`).emit(event, data)
}

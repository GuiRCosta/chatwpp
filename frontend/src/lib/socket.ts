import { io, Socket } from "socket.io-client"

let socket: Socket | null = null

export function connectSocket(token: string): Socket {
  // If already connected, disconnect first
  if (socket) {
    disconnectSocket()
  }

  // Connect to the backend with auth token
  socket = io("/", {
    auth: {
      token
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  })

  socket.on("connect", () => {
    console.info("Socket.IO connected")
  })

  socket.on("disconnect", (reason) => {
    console.info("Socket.IO disconnected:", reason)
  })

  socket.on("connect_error", (error) => {
    console.error("Socket.IO connection error:", error)
  })

  return socket
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function getSocket(): Socket | null {
  return socket
}

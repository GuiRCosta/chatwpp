import "reflect-metadata"
import dotenv from "dotenv"
dotenv.config()

import { Sequelize } from "sequelize-typescript"
import { createServer } from "http"

import app from "./app"
import { initSocket, closeSocket } from "./libs/socket"
import dbConfig from "./config/database"
import models from "./models"
import { closeRedis } from "./config/redis"
import { initQueues, closeQueues } from "./libs/queues"
import { initScheduledJobs, stopScheduledJobs } from "./jobs/ScheduledJobs"
import { logger } from "./helpers/logger"
import { setShuttingDown } from "./helpers/shutdownState"

const PORT = Number(process.env.PORT) || 7563
const SHUTDOWN_TIMEOUT_MS = 30_000

async function bootstrap(): Promise<void> {
  const sequelize = new Sequelize({
    ...dbConfig,
    models
  })

  try {
    await sequelize.authenticate()
    logger.info("Database connection established successfully")
  } catch (error) {
    logger.error("Unable to connect to the database:", error)
    process.exit(1)
  }

  initQueues()
  initScheduledJobs()

  const httpServer = createServer(app)

  initSocket(httpServer)

  httpServer.listen(PORT, () => {
    logger.info(`Nuvio backend running on port ${PORT}`)
    logger.info(`Environment: ${process.env.NODE_ENV || "development"}`)
  })

  let shutdownInProgress = false

  const gracefulShutdown = async (signal: string): Promise<void> => {
    if (shutdownInProgress) return
    shutdownInProgress = true
    setShuttingDown()

    logger.info(`${signal} received. Shutting down gracefully...`)

    const forceExit = setTimeout(() => {
      logger.error("Shutdown timed out after %dms. Forcing exit.", SHUTDOWN_TIMEOUT_MS)
      process.exit(1)
    }, SHUTDOWN_TIMEOUT_MS)
    forceExit.unref()

    stopScheduledJobs()
    closeSocket()

    httpServer.close(async () => {
      try {
        await closeQueues()
        await closeRedis()
        await sequelize.close()
        logger.info("All connections closed")
        process.exit(0)
      } catch (error) {
        logger.error("Error during shutdown: %o", error)
        process.exit(1)
      }
    })
  }

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
  process.on("SIGINT", () => gracefulShutdown("SIGINT"))
}

bootstrap().catch((err) => {
  logger.error("Failed to start server:", err)
  process.exit(1)
})

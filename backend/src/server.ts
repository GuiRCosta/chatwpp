import dotenv from "dotenv"
dotenv.config()

import { Sequelize } from "sequelize-typescript"
import { createServer } from "http"

import app from "./app"
import { initSocket } from "./libs/socket"
import dbConfig from "./config/database"
import { closeRedis } from "./config/redis"
import { initQueues, closeQueues } from "./libs/queues"
import { initScheduledJobs, stopScheduledJobs } from "./jobs/ScheduledJobs"
import { logger } from "./helpers/logger"

const PORT = Number(process.env.PORT) || 7563

async function bootstrap(): Promise<void> {
  const sequelize = new Sequelize({
    ...dbConfig,
    models: [__dirname + "/models"]
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
    logger.info(`ZFlow backend running on port ${PORT}`)
    logger.info(`Environment: ${process.env.NODE_ENV || "development"}`)
  })

  const gracefulShutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received. Shutting down gracefully...`)

    stopScheduledJobs()

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

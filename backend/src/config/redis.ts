import Redis from "ioredis"
import logger from "../helpers/logger"

const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null
}

let redisClient: Redis | null = null

export function getRedisConfig(): typeof redisConfig {
  return { ...redisConfig }
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(redisConfig)

    redisClient.on("connect", () => {
      logger.info("Redis connected")
    })

    redisClient.on("error", (error) => {
      logger.error("Redis error: %o", error)
    })
  }

  return redisClient
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
    logger.info("Redis disconnected")
  }
}

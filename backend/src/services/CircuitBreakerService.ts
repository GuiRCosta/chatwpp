import { getRedisClient } from "../config/redis"
import { logger } from "../helpers/logger"

const FAILURE_THRESHOLD = 5
const CIRCUIT_WINDOW_SECONDS = 300 // 5 minutes

export interface CircuitState {
  isOpen: boolean
  failureCount: number
}

export async function recordFailure(whatsappId: number): Promise<CircuitState> {
  const redis = getRedisClient()
  const key = `circuit:whatsapp:${whatsappId}`

  const count = await redis.incr(key)

  if (count === 1) {
    await redis.expire(key, CIRCUIT_WINDOW_SECONDS)
  }

  const isOpen = count >= FAILURE_THRESHOLD

  if (isOpen && count === FAILURE_THRESHOLD) {
    logger.warn(
      "CircuitBreaker: Circuit opened for WhatsApp %d after %d failures",
      whatsappId,
      FAILURE_THRESHOLD
    )
  }

  return { isOpen, failureCount: count }
}

export async function recordSuccess(whatsappId: number): Promise<void> {
  const redis = getRedisClient()
  const key = `circuit:whatsapp:${whatsappId}`

  await redis.del(key)
}

export async function isCircuitOpen(whatsappId: number): Promise<boolean> {
  const redis = getRedisClient()
  const key = `circuit:whatsapp:${whatsappId}`

  const count = await redis.get(key)
  const failureCount = count ? parseInt(count, 10) : 0

  return failureCount >= FAILURE_THRESHOLD
}

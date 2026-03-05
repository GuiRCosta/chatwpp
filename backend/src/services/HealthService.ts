import Tenant from "../models/Tenant"
import { getRedisClient } from "../config/redis"
import { getAllQueues } from "../libs/queues"

interface CheckResult {
  status: "up" | "down" | "degraded"
  latencyMs?: number
  error?: string
  activeQueues?: number
}

export interface HealthResult {
  status: "healthy" | "degraded" | "unhealthy"
  checks: {
    postgres: CheckResult
    redis: CheckResult
    bull: CheckResult
  }
}

const CHECK_TIMEOUT_MS = 5000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Health check timed out")), ms)
    )
  ])
}

async function checkPostgres(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const sequelize = Tenant.sequelize
    if (!sequelize) {
      return { status: "down", error: "Sequelize not initialized" }
    }
    await withTimeout(sequelize.authenticate(), CHECK_TIMEOUT_MS)
    return { status: "up", latencyMs: Date.now() - start }
  } catch (err) {
    return {
      status: "down",
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err)
    }
  }
}

async function checkRedis(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const client = getRedisClient()
    await withTimeout(client.ping(), CHECK_TIMEOUT_MS)
    return { status: "up", latencyMs: Date.now() - start }
  } catch (err) {
    return {
      status: "down",
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err)
    }
  }
}

async function checkBull(): Promise<CheckResult> {
  try {
    const queues = getAllQueues()

    if (queues.length === 0) {
      return { status: "up", activeQueues: 0 }
    }

    const results = await Promise.allSettled(
      queues.map((q) => withTimeout(q.isReady(), CHECK_TIMEOUT_MS))
    )

    const readyCount = results.filter((r) => r.status === "fulfilled").length

    if (readyCount === queues.length) {
      return { status: "up", activeQueues: readyCount }
    }

    return {
      status: "degraded",
      activeQueues: readyCount,
      error: `${queues.length - readyCount} queue(s) not ready`
    }
  } catch (err) {
    return {
      status: "down",
      activeQueues: 0,
      error: err instanceof Error ? err.message : String(err)
    }
  }
}

export async function getHealth(): Promise<HealthResult> {
  const [postgres, redis, bull] = await Promise.allSettled([
    checkPostgres(),
    checkRedis(),
    checkBull()
  ])

  const pgResult =
    postgres.status === "fulfilled"
      ? postgres.value
      : { status: "down" as const, error: postgres.reason?.message }

  const redisResult =
    redis.status === "fulfilled"
      ? redis.value
      : { status: "down" as const, error: redis.reason?.message }

  const bullResult =
    bull.status === "fulfilled"
      ? bull.value
      : { status: "down" as const, activeQueues: 0, error: bull.reason?.message }

  const checks = { postgres: pgResult, redis: redisResult, bull: bullResult }

  let status: HealthResult["status"] = "healthy"

  if (pgResult.status === "down") {
    status = "unhealthy"
  } else if (redisResult.status === "down" || bullResult.status === "degraded") {
    status = "degraded"
  }

  return { status, checks }
}

import Bull from "bull"

import { getRedisConfig } from "../config/redis"
import * as SendMessageJob from "../jobs/SendMessageJob"
import * as BulkDispatchJob from "../jobs/BulkDispatchJob"
import * as CampaignJob from "../jobs/CampaignJob"
import * as CleanupTicketsJob from "../jobs/CleanupTicketsJob"
import logger from "../helpers/logger"

interface QueueDefinition {
  name: string
  processor: (job: Bull.Job) => Promise<void>
  options: Bull.QueueOptions
}

const redisConfig = getRedisConfig()

const queueDefinitions: QueueDefinition[] = [
  {
    name: SendMessageJob.QUEUE_NAME,
    processor: SendMessageJob.process,
    options: {
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 3000 },
        removeOnComplete: 1000,
        removeOnFail: 5000
      }
    }
  },
  {
    name: BulkDispatchJob.QUEUE_NAME,
    processor: BulkDispatchJob.process,
    options: {
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: 500,
        removeOnFail: 2000
      }
    }
  },
  {
    name: CampaignJob.QUEUE_NAME,
    processor: CampaignJob.process,
    options: {
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: 500,
        removeOnFail: 2000
      }
    }
  },
  {
    name: CleanupTicketsJob.QUEUE_NAME,
    processor: CleanupTicketsJob.process,
    options: {
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: 100,
        removeOnFail: 500
      }
    }
  }
]

const concurrencyMap: Record<string, number> = {
  [SendMessageJob.QUEUE_NAME]: 5,
  [BulkDispatchJob.QUEUE_NAME]: 1,
  [CampaignJob.QUEUE_NAME]: 1,
  [CleanupTicketsJob.QUEUE_NAME]: 1
}

const queues: Map<string, Bull.Queue> = new Map()

export function initQueues(): void {
  for (const def of queueDefinitions) {
    const queue = new Bull(def.name, {
      redis: redisConfig,
      ...def.options
    })

    const concurrency = concurrencyMap[def.name] || 1
    queue.process(concurrency, def.processor)

    queue.on("failed", (job, error) => {
      logger.error(
        "Queue %s: Job %s failed (attempt %d/%d): %o",
        def.name,
        job.id,
        job.attemptsMade,
        job.opts.attempts || 1,
        error
      )
    })

    queue.on("completed", (job) => {
      logger.debug("Queue %s: Job %s completed", def.name, job.id)
    })

    queues.set(def.name, queue)
  }

  logger.info("Bull queues initialized: %s", queueDefinitions.map(d => d.name).join(", "))
}

export function getQueue(name: string): Bull.Queue {
  const queue = queues.get(name)
  if (!queue) {
    throw new Error(`Queue "${name}" not found. Did you call initQueues()?`)
  }
  return queue
}

export function getAllQueues(): Bull.Queue[] {
  return Array.from(queues.values())
}

export async function closeQueues(): Promise<void> {
  const closePromises = Array.from(queues.values()).map(queue => queue.close())
  await Promise.all(closePromises)
  queues.clear()
  logger.info("All Bull queues closed")
}

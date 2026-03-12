import { getQueue } from "../libs/queues"
import { QUEUE_NAME as DLQ_NAME } from "../jobs/DeadLetterJob"
import type { DeadLetterData } from "../jobs/DeadLetterJob"
import { QUEUE_NAME as SEND_MESSAGE_QUEUE } from "../jobs/SendMessageJob"
import type { SendMessageData } from "../jobs/SendMessageJob"
import { AppError } from "../helpers/AppError"
import { logger } from "../helpers/logger"

interface DeadLetterJobInfo {
  id: string
  data: DeadLetterData
  timestamp: number
}

interface ListResult {
  jobs: DeadLetterJobInfo[]
  count: number
}

export async function listDeadLetterJobs(tenantId: number): Promise<ListResult> {
  const dlq = getQueue(DLQ_NAME)

  const completedJobs = await dlq.getCompleted(0, 500)

  const filtered = completedJobs.filter(job => job.data.tenantId === tenantId)

  const jobs: DeadLetterJobInfo[] = filtered.map(job => ({
    id: String(job.id),
    data: job.data as DeadLetterData,
    timestamp: job.timestamp
  }))

  const sorted = [...jobs].sort((a, b) => b.timestamp - a.timestamp)

  return { jobs: sorted, count: sorted.length }
}

export async function retryDeadLetterJob(jobId: string, tenantId: number): Promise<void> {
  const dlq = getQueue(DLQ_NAME)
  const job = await dlq.getJob(jobId)

  if (!job) {
    throw new AppError("Dead letter job not found", 404)
  }

  const dlqData = job.data as DeadLetterData

  if (dlqData.tenantId !== tenantId) {
    throw new AppError("Dead letter job not found", 404)
  }

  if (dlqData.originalQueue !== SEND_MESSAGE_QUEUE) {
    throw new AppError(`Unknown original queue: ${dlqData.originalQueue}`, 400)
  }

  const sendQueue = getQueue(SEND_MESSAGE_QUEUE)

  const retryData: SendMessageData = {
    messageId: dlqData.messageId,
    ticketId: dlqData.ticketId,
    tenantId: dlqData.tenantId
  }

  await sendQueue.add(retryData)
  await job.remove()

  logger.info(
    "DeadLetterService: Retried message %d from DLQ (job %s)",
    dlqData.messageId,
    jobId
  )
}

export async function deleteDeadLetterJob(jobId: string, tenantId: number): Promise<void> {
  const dlq = getQueue(DLQ_NAME)
  const job = await dlq.getJob(jobId)

  if (!job) {
    throw new AppError("Dead letter job not found", 404)
  }

  const dlqData = job.data as DeadLetterData

  if (dlqData.tenantId !== tenantId) {
    throw new AppError("Dead letter job not found", 404)
  }

  await job.remove()

  logger.info("DeadLetterService: Deleted DLQ job %s", jobId)
}

import { Job } from "bull"
import { Op } from "sequelize"

import Message from "../models/Message"
import Ticket from "../models/Ticket"
import Contact from "../models/Contact"
import WhatsApp from "../models/WhatsApp"
import User from "../models/User"
import { sendTextMessage, sendMediaMessage } from "../libs/waba/wabaClient"
import { emitToTicket } from "../libs/socket"
import { getQueue } from "../libs/queues"
import { QUEUE_NAME as DLQ_NAME } from "./DeadLetterJob"
import type { DeadLetterData } from "./DeadLetterJob"
import * as CircuitBreaker from "../services/CircuitBreakerService"
import { createNotification } from "../services/NotificationService"
import { logger } from "../helpers/logger"

export const QUEUE_NAME = "send-message"

export interface SendMessageData {
  messageId: number
  ticketId: number
  tenantId: number
}

// eslint-disable-next-line @typescript-eslint/no-shadow
export async function process(job: Job<SendMessageData>): Promise<void> {
  const { messageId, ticketId, tenantId } = job.data

  const message = await Message.findByPk(messageId)
  if (!message) {
    logger.warn("SendMessageJob: Message %d not found", messageId)
    return
  }

  const ticket = await Ticket.findByPk(ticketId)
  if (!ticket || !ticket.whatsappId) {
    logger.warn("SendMessageJob: Ticket %d not found or no WhatsApp", ticketId)
    return
  }

  const whatsapp = await WhatsApp.findByPk(ticket.whatsappId)
  if (!whatsapp || whatsapp.status !== "connected" || !whatsapp.wabaPhoneNumberId || !whatsapp.wabaToken) {
    logger.warn("SendMessageJob: WhatsApp %d not available", ticket.whatsappId)
    return
  }

  const circuitOpen = await CircuitBreaker.isCircuitOpen(whatsapp.id)
  if (circuitOpen) {
    logger.warn(
      "SendMessageJob: Circuit open for WhatsApp %d, skipping message %d",
      whatsapp.id,
      messageId
    )
    await moveToDeadLetter(job, whatsapp.id, "Circuit breaker open")
    return
  }

  const contact = await Contact.findByPk(ticket.contactId)
  if (!contact || !contact.number) {
    logger.warn("SendMessageJob: Contact %d not found", ticket.contactId)
    return
  }

  try {
    let response

    if (message.mediaUrl && message.mediaType) {
      const mediaTypeMap: Record<string, "image" | "video" | "audio" | "document"> = {
        image: "image",
        video: "video",
        audio: "audio",
        document: "document"
      }

      const type = mediaTypeMap[message.mediaType] || "document"
      const backendUrl = globalThis.process.env.BACKEND_URL || "http://localhost:7563"
      const fullMediaUrl = `${backendUrl}/public/${message.mediaUrl}`

      response = await sendMediaMessage(
        whatsapp.wabaPhoneNumberId,
        whatsapp.wabaToken,
        contact.number,
        type,
        fullMediaUrl,
        message.body || undefined
      )
    } else {
      response = await sendTextMessage(
        whatsapp.wabaPhoneNumberId,
        whatsapp.wabaToken,
        contact.number,
        message.body
      )
    }

    if (response?.messages?.[0]?.id) {
      await message.update({
        remoteJid: response.messages[0].id,
        status: "sent",
        ack: 1
      })

      emitToTicket(ticketId, "message:updated", message)
    }

    await CircuitBreaker.recordSuccess(whatsapp.id)

    logger.info("SendMessageJob: Message %d sent to %s", messageId, contact.number)
  } catch (error) {
    const newState = await CircuitBreaker.recordFailure(whatsapp.id)

    logger.error(
      "SendMessageJob: Failed message %d (WhatsApp %d, failures: %d/5): %o",
      messageId,
      whatsapp.id,
      newState.failureCount,
      error
    )

    if (newState.isOpen && newState.failureCount === 5) {
      await whatsapp.update({ status: "disconnected" })
      await notifyAdminsCircuitOpen(tenantId, whatsapp)
    }

    const maxAttempts = job.opts.attempts || 3
    const isLastAttempt = job.attemptsMade >= maxAttempts - 1

    if (isLastAttempt || newState.isOpen) {
      const reason = error instanceof Error ? error.message : String(error)
      await moveToDeadLetter(job, whatsapp.id, reason)
      return
    }

    throw error
  }
}

async function moveToDeadLetter(
  job: Job<SendMessageData>,
  whatsappId: number,
  reason: string
): Promise<void> {
  try {
    const dlq = getQueue(DLQ_NAME)

    const dlqData: DeadLetterData = {
      messageId: job.data.messageId,
      ticketId: job.data.ticketId,
      tenantId: job.data.tenantId,
      whatsappId,
      originalQueue: QUEUE_NAME,
      failureReason: reason,
      failedAt: new Date().toISOString(),
      attemptsMade: job.attemptsMade
    }

    await dlq.add(dlqData)

    logger.info("SendMessageJob: Message %d moved to DLQ", job.data.messageId)
  } catch (dlqError) {
    logger.error("SendMessageJob: Failed to move message %d to DLQ: %o", job.data.messageId, dlqError)
  }
}

async function notifyAdminsCircuitOpen(
  tenantId: number,
  whatsapp: WhatsApp
): Promise<void> {
  const admins = await User.findAll({
    where: {
      tenantId,
      profile: { [Op.in]: ["admin", "superadmin"] }
    },
    attributes: ["id"]
  })

  const notificationPromises = admins.map(admin =>
    createNotification(tenantId, {
      userId: admin.id,
      title: "WhatsApp Instavel",
      message: `A conexao "${whatsapp.name}" (${whatsapp.number}) falhou 5 vezes consecutivas e foi desconectada. Verifique a conexao.`
    })
  )

  await Promise.allSettled(notificationPromises)
}

import { Job } from "bull"

import BulkDispatch from "../models/BulkDispatch"
import WhatsApp from "../models/WhatsApp"
import Contact from "../models/Contact"
import { sendTextMessage } from "../libs/waba/wabaClient"
import { emitToTenant } from "../libs/socket"
import logger from "../helpers/logger"

export const QUEUE_NAME = "bulk-dispatch"

export interface BulkDispatchData {
  bulkDispatchId: number
  tenantId: number
  message: string
  contactIds: number[]
}

const DELAY_BETWEEN_MESSAGES_MS = 1500

export async function process(job: Job<BulkDispatchData>): Promise<void> {
  const { bulkDispatchId, tenantId, message, contactIds } = job.data

  const dispatch = await BulkDispatch.findByPk(bulkDispatchId)
  if (!dispatch) {
    logger.warn("BulkDispatchJob: Dispatch %d not found", bulkDispatchId)
    return
  }

  await dispatch.update({
    status: "processing",
    totalMessages: contactIds.length
  })

  emitToTenant(tenantId, "bulkDispatch:updated", dispatch)

  const whatsapp = dispatch.whatsappId
    ? await WhatsApp.findByPk(dispatch.whatsappId)
    : null

  if (!whatsapp || !whatsapp.wabaPhoneNumberId || !whatsapp.wabaToken) {
    await dispatch.update({ status: "cancelled" })
    logger.error("BulkDispatchJob: No valid WhatsApp for dispatch %d", bulkDispatchId)
    return
  }

  let sentCount = 0
  let errorCount = 0

  for (const contactId of contactIds) {
    if (dispatch.status === "cancelled") break

    const contact = await Contact.findByPk(contactId)
    if (!contact || !contact.number) {
      errorCount++
      continue
    }

    try {
      await sendTextMessage(
        whatsapp.wabaPhoneNumberId,
        whatsapp.wabaToken,
        contact.number,
        message
      )
      sentCount++
    } catch (error) {
      errorCount++
      logger.error("BulkDispatchJob: Failed to send to contact %d: %o", contactId, error)
    }

    await dispatch.update({ sentMessages: sentCount, errorMessages: errorCount })

    if (contactIds.indexOf(contactId) < contactIds.length - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_MESSAGES_MS))
    }
  }

  await dispatch.update({
    status: "completed",
    sentMessages: sentCount,
    errorMessages: errorCount
  })

  emitToTenant(tenantId, "bulkDispatch:updated", dispatch)

  logger.info(
    "BulkDispatchJob: Dispatch %d completed. Sent: %d, Errors: %d",
    bulkDispatchId, sentCount, errorCount
  )
}

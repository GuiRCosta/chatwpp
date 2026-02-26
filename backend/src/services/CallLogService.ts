import CallLog from "../models/CallLog"
import Contact from "../models/Contact"
import User from "../models/User"
import { AppError } from "../helpers/AppError"
import { emitToTenant } from "../libs/socket"

interface ListParams {
  tenantId: number
  type?: string
  contactId?: number
}

export const listCallLogs = async ({ tenantId, type, contactId }: ListParams): Promise<CallLog[]> => {
  const where: Record<string, unknown> = { tenantId }

  if (type) {
    where.type = type
  }

  if (contactId) {
    where.contactId = contactId
  }

  const callLogs = await CallLog.findAll({
    where,
    include: [
      {
        model: Contact,
        attributes: ["id", "name", "number"]
      },
      {
        model: User,
        attributes: ["id", "name"]
      }
    ],
    order: [["createdAt", "DESC"]]
  })

  return callLogs
}

export const findCallLogById = async (id: number, tenantId: number): Promise<CallLog> => {
  const callLog = await CallLog.findOne({
    where: { id, tenantId },
    include: [
      {
        model: Contact,
        attributes: ["id", "name", "number"]
      },
      {
        model: User,
        attributes: ["id", "name"]
      }
    ]
  })

  if (!callLog) {
    throw new AppError("CallLog not found", 404)
  }

  return callLog
}

export const createCallLog = async (tenantId: number, userId: number, data: {
  contactId: number
  type: string
  duration?: number
}): Promise<CallLog> => {
  const callLog = await CallLog.create({
    tenantId,
    userId,
    contactId: data.contactId,
    type: data.type,
    duration: data.duration
  })

  const callLogWithRelations = await CallLog.findOne({
    where: { id: callLog.id },
    include: [
      {
        model: Contact,
        attributes: ["id", "name", "number"]
      },
      {
        model: User,
        attributes: ["id", "name"]
      }
    ]
  })

  emitToTenant(tenantId, "calllog:created", callLogWithRelations)

  return callLogWithRelations!
}

export const deleteCallLog = async (id: number, tenantId: number): Promise<void> => {
  const callLog = await CallLog.findOne({ where: { id, tenantId } })

  if (!callLog) {
    throw new AppError("CallLog not found", 404)
  }

  await callLog.destroy()

  emitToTenant(tenantId, "calllog:deleted", { id })
}

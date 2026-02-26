import { Op } from "sequelize"

import ChatFlow from "../models/ChatFlow"
import Ticket from "../models/Ticket"
import { AppError } from "../helpers/AppError"
import { emitToTenant } from "../libs/socket"

interface ListParams {
  tenantId: number
  searchParam?: string
  isActive?: boolean
}

export const listChatFlows = async ({ tenantId, searchParam = "", isActive }: ListParams): Promise<ChatFlow[]> => {
  const where: Record<string, unknown> = { tenantId }

  if (searchParam) {
    where.name = { [Op.iLike]: `%${searchParam}%` }
  }

  if (isActive !== undefined) {
    where.isActive = isActive
  }

  const chatFlows = await ChatFlow.findAll({
    where,
    order: [["name", "ASC"]]
  })

  return chatFlows
}

export const findChatFlowById = async (id: number, tenantId: number): Promise<ChatFlow> => {
  const chatFlow = await ChatFlow.findOne({
    where: { id, tenantId }
  })

  if (!chatFlow) {
    throw new AppError("ChatFlow not found", 404)
  }

  return chatFlow
}

export const createChatFlow = async (tenantId: number, data: {
  name: string
  flow?: object
  isActive?: boolean
}): Promise<ChatFlow> => {
  const chatFlow = await ChatFlow.create({
    tenantId,
    name: data.name,
    flow: data.flow || {},
    isActive: data.isActive !== undefined ? data.isActive : true
  })

  emitToTenant(tenantId, "chatflow:created", chatFlow)

  return chatFlow
}

export const updateChatFlow = async (id: number, tenantId: number, data: {
  name?: string
  flow?: object
  isActive?: boolean
}): Promise<ChatFlow> => {
  const chatFlow = await ChatFlow.findOne({ where: { id, tenantId } })

  if (!chatFlow) {
    throw new AppError("ChatFlow not found", 404)
  }

  await chatFlow.update(data)

  emitToTenant(tenantId, "chatflow:updated", chatFlow)

  return chatFlow
}

export const deleteChatFlow = async (id: number, tenantId: number): Promise<void> => {
  const chatFlow = await ChatFlow.findOne({ where: { id, tenantId } })

  if (!chatFlow) {
    throw new AppError("ChatFlow not found", 404)
  }

  const activeTicketsCount = await Ticket.count({
    where: {
      chatFlowId: id,
      status: { [Op.notIn]: ["closed"] }
    }
  })

  if (activeTicketsCount > 0) {
    throw new AppError("Cannot delete ChatFlow with active tickets", 409)
  }

  await chatFlow.destroy()

  emitToTenant(tenantId, "chatflow:deleted", { id })
}

export const duplicateChatFlow = async (id: number, tenantId: number): Promise<ChatFlow> => {
  const originalChatFlow = await ChatFlow.findOne({ where: { id, tenantId } })

  if (!originalChatFlow) {
    throw new AppError("ChatFlow not found", 404)
  }

  const flowCopy = JSON.parse(JSON.stringify(originalChatFlow.flow))

  const duplicatedChatFlow = await ChatFlow.create({
    tenantId,
    name: `${originalChatFlow.name} (copy)`,
    flow: flowCopy,
    isActive: false
  })

  emitToTenant(tenantId, "chatflow:created", duplicatedChatFlow)

  return duplicatedChatFlow
}

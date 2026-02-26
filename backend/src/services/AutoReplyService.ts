import { Op } from "sequelize"

import AutoReply from "../models/AutoReply"
import AutoReplyStep from "../models/AutoReplyStep"
import { AppError } from "../helpers/AppError"
import { emitToTenant } from "../libs/socket"

interface ListParams {
  tenantId: number
  searchParam?: string
  isActive?: boolean
}

export const listAutoReplies = async ({ tenantId, searchParam = "", isActive }: ListParams): Promise<AutoReply[]> => {
  const where: Record<string, unknown> = { tenantId }

  if (searchParam) {
    where.name = { [Op.iLike]: `%${searchParam}%` }
  }

  if (isActive !== undefined) {
    where.isActive = isActive
  }

  const autoReplies = await AutoReply.findAll({
    where,
    order: [["name", "ASC"]]
  })

  return autoReplies
}

export const findAutoReplyById = async (id: number, tenantId: number): Promise<AutoReply> => {
  const autoReply = await AutoReply.findOne({
    where: { id, tenantId },
    include: [
      {
        model: AutoReplyStep,
        as: "steps",
        separate: true,
        order: [["stepOrder", "ASC"]]
      }
    ]
  })

  if (!autoReply) {
    throw new AppError("Auto reply not found", 404)
  }

  return autoReply
}

export const createAutoReply = async (tenantId: number, userId: number, data: {
  name: string
  action: string
  isActive?: boolean
}): Promise<AutoReply> => {
  const autoReply = await AutoReply.create({
    tenantId,
    userId,
    name: data.name,
    action: data.action,
    isActive: data.isActive !== undefined ? data.isActive : true
  })

  emitToTenant(tenantId, "autoreply:created", autoReply)

  return autoReply
}

export const updateAutoReply = async (id: number, tenantId: number, data: {
  name?: string
  action?: string
  isActive?: boolean
}): Promise<AutoReply> => {
  const autoReply = await AutoReply.findOne({ where: { id, tenantId } })

  if (!autoReply) {
    throw new AppError("Auto reply not found", 404)
  }

  await autoReply.update(data)

  emitToTenant(tenantId, "autoreply:updated", autoReply)

  return autoReply
}

export const deleteAutoReply = async (id: number, tenantId: number): Promise<void> => {
  const autoReply = await AutoReply.findOne({ where: { id, tenantId } })

  if (!autoReply) {
    throw new AppError("Auto reply not found", 404)
  }

  await autoReply.destroy()

  emitToTenant(tenantId, "autoreply:deleted", { id })
}

export const createStep = async (autoReplyId: number, tenantId: number, data: {
  stepOrder: number
  message: string
  mediaUrl?: string
  action?: object | null
}): Promise<AutoReplyStep> => {
  const autoReply = await AutoReply.findOne({ where: { id: autoReplyId, tenantId } })

  if (!autoReply) {
    throw new AppError("Auto reply not found", 404)
  }

  const existingStep = await AutoReplyStep.findOne({
    where: { autoReplyId, stepOrder: data.stepOrder }
  })

  if (existingStep) {
    throw new AppError("A step with this order already exists", 409)
  }

  const step = await AutoReplyStep.create({
    autoReplyId,
    stepOrder: data.stepOrder,
    message: data.message,
    mediaUrl: data.mediaUrl || "",
    action: data.action || null
  })

  emitToTenant(tenantId, "autoreply:step:created", { autoReplyId, step })

  return step
}

export const updateStep = async (autoReplyId: number, stepId: number, tenantId: number, data: {
  stepOrder?: number
  message?: string
  mediaUrl?: string
  action?: object | null
}): Promise<AutoReplyStep> => {
  const autoReply = await AutoReply.findOne({ where: { id: autoReplyId, tenantId } })

  if (!autoReply) {
    throw new AppError("Auto reply not found", 404)
  }

  const step = await AutoReplyStep.findOne({ where: { id: stepId, autoReplyId } })

  if (!step) {
    throw new AppError("Step not found", 404)
  }

  if (data.stepOrder !== undefined && data.stepOrder !== step.stepOrder) {
    const existingStep = await AutoReplyStep.findOne({
      where: {
        autoReplyId,
        stepOrder: data.stepOrder,
        id: { [Op.ne]: stepId }
      }
    })

    if (existingStep) {
      throw new AppError("A step with this order already exists", 409)
    }
  }

  await step.update(data)

  emitToTenant(tenantId, "autoreply:step:updated", { autoReplyId, step })

  return step
}

export const deleteStep = async (autoReplyId: number, stepId: number, tenantId: number): Promise<void> => {
  const autoReply = await AutoReply.findOne({ where: { id: autoReplyId, tenantId } })

  if (!autoReply) {
    throw new AppError("Auto reply not found", 404)
  }

  const step = await AutoReplyStep.findOne({ where: { id: stepId, autoReplyId } })

  if (!step) {
    throw new AppError("Step not found", 404)
  }

  const deletedStepOrder = step.stepOrder

  await step.destroy()

  const remainingSteps = await AutoReplyStep.findAll({
    where: {
      autoReplyId,
      stepOrder: { [Op.gt]: deletedStepOrder }
    },
    order: [["stepOrder", "ASC"]]
  })

  for (const remainingStep of remainingSteps) {
    await remainingStep.update({ stepOrder: remainingStep.stepOrder - 1 })
  }

  emitToTenant(tenantId, "autoreply:step:deleted", { autoReplyId, stepId })
}

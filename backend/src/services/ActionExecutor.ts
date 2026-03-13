import { Op } from "sequelize"

import Ticket from "../models/Ticket"
import User from "../models/User"
import Tag from "../models/Tag"
import ContactTag from "../models/ContactTag"
import { getQueue } from "../libs/queues"
import { QUEUE_NAME as WEBHOOK_QUEUE } from "../jobs/WebhookDispatchJob"
import * as MessageService from "./MessageService"
import * as TicketService from "./TicketService"
import * as NotificationService from "./NotificationService"
import * as OpportunityService from "./OpportunityService"
import { logger } from "../helpers/logger"

export interface MacroAction {
  type: string
  params: Record<string, unknown>
}

export interface ActionContext {
  ticketId: number
  tenantId: number
  userId: number
}

export interface ActionResult {
  type: string
  success: boolean
  error?: string
}

export interface ExecutionResult {
  totalActions: number
  succeeded: number
  failed: number
  results: ActionResult[]
}

type ActionHandler = (
  ctx: ActionContext,
  params: Record<string, unknown>
) => Promise<void>

async function handleSendMessage(
  ctx: ActionContext,
  params: Record<string, unknown>
): Promise<void> {
  const body = String(params.body || "")
  if (!body.trim()) {
    throw new Error("Message body is empty")
  }

  await MessageService.createMessage(ctx.ticketId, ctx.tenantId, {
    body,
    fromMe: true
  })
}

async function handleAssignAgent(
  ctx: ActionContext,
  params: Record<string, unknown>
): Promise<void> {
  const targetUserId = Number(params.userId)
  if (!targetUserId) {
    throw new Error("userId is required for assign_agent")
  }

  const agent = await User.findOne({
    where: { id: targetUserId, tenantId: ctx.tenantId }
  })
  if (!agent) {
    throw new Error(`Agent ${targetUserId} not found in this tenant`)
  }

  await TicketService.updateTicket(
    ctx.ticketId,
    ctx.tenantId,
    ctx.userId,
    { userId: targetUserId }
  )
}

async function handleAddTag(
  ctx: ActionContext,
  params: Record<string, unknown>
): Promise<void> {
  const tagIds = params.tagIds as number[]
  if (!Array.isArray(tagIds) || tagIds.length === 0) {
    throw new Error("tagIds array is required for add_tag")
  }

  const ticket = await Ticket.findOne({
    where: { id: ctx.ticketId, tenantId: ctx.tenantId }
  })
  if (!ticket) {
    throw new Error("Ticket not found")
  }

  const validTags = await Tag.findAll({
    where: { id: tagIds, tenantId: ctx.tenantId }
  })

  if (validTags.length === 0) {
    throw new Error("No valid tags found for this tenant")
  }

  const entries = validTags.map((tag) => ({
    contactId: ticket.contactId,
    tagId: tag.id
  }))

  await ContactTag.bulkCreate(entries, { ignoreDuplicates: true })
}

async function handleRemoveTag(
  ctx: ActionContext,
  params: Record<string, unknown>
): Promise<void> {
  const tagIds = params.tagIds as number[]
  if (!Array.isArray(tagIds) || tagIds.length === 0) {
    throw new Error("tagIds array is required for remove_tag")
  }

  const ticket = await Ticket.findOne({
    where: { id: ctx.ticketId, tenantId: ctx.tenantId }
  })
  if (!ticket) {
    throw new Error("Ticket not found")
  }

  await ContactTag.destroy({
    where: { contactId: ticket.contactId, tagId: tagIds }
  })
}

async function handleCloseTicket(ctx: ActionContext): Promise<void> {
  await TicketService.updateTicket(
    ctx.ticketId,
    ctx.tenantId,
    ctx.userId,
    { status: "closed" }
  )
}

async function handleReopenTicket(ctx: ActionContext): Promise<void> {
  await TicketService.updateTicket(
    ctx.ticketId,
    ctx.tenantId,
    ctx.userId,
    { status: "open" }
  )
}

async function handleSendWebhook(
  ctx: ActionContext,
  params: Record<string, unknown>
): Promise<void> {
  const url = String(params.url || "")
  if (!url) {
    throw new Error("url is required for send_webhook")
  }

  const ticket = await Ticket.findByPk(ctx.ticketId)

  const queue = getQueue(WEBHOOK_QUEUE)
  await queue.add({
    url,
    secret: null,
    event: "macro_webhook",
    payload: {
      ticketId: ctx.ticketId,
      tenantId: ctx.tenantId,
      triggeredBy: ctx.userId,
      ticketStatus: ticket?.status,
      contactId: ticket?.contactId
    }
  })
}

async function handleSendNotification(
  ctx: ActionContext,
  params: Record<string, unknown>
): Promise<void> {
  const title = String(params.title || "Macro Notification")
  const message = String(params.message || "")

  const admins = await User.findAll({
    where: {
      tenantId: ctx.tenantId,
      profile: { [Op.in]: ["admin", "superadmin"] }
    },
    attributes: ["id"]
  })

  const promises = admins.map((admin) =>
    NotificationService.createNotification(ctx.tenantId, {
      userId: admin.id,
      title,
      message
    })
  )

  await Promise.allSettled(promises)
}

async function handleCreateOpportunity(
  ctx: ActionContext,
  params: Record<string, unknown>
): Promise<void> {
  const pipelineId = Number(params.pipelineId)
  const stageId = Number(params.stageId)

  if (!pipelineId) {
    throw new Error("pipelineId is required for create_opportunity")
  }
  if (!stageId) {
    throw new Error("stageId is required for create_opportunity")
  }

  const ticket = await Ticket.findOne({
    where: { id: ctx.ticketId, tenantId: ctx.tenantId }
  })
  if (!ticket) {
    throw new Error("Ticket not found")
  }

  await OpportunityService.createOpportunity(ctx.tenantId, {
    contactId: ticket.contactId,
    pipelineId,
    stageId,
    title: params.title ? String(params.title) : undefined,
    value: params.value ? Number(params.value) : undefined
  })
}

async function handleSendMedia(
  ctx: ActionContext,
  params: Record<string, unknown>
): Promise<void> {
  const mediaUrl = String(params.mediaUrl || "")
  const mediaType = String(params.mediaType || "")

  if (!mediaUrl) {
    throw new Error("mediaUrl is required for send_media")
  }
  if (!mediaType) {
    throw new Error("mediaType is required for send_media")
  }

  const body = String(params.body || "")

  await MessageService.createMessage(ctx.ticketId, ctx.tenantId, {
    body,
    mediaUrl,
    mediaType,
    fromMe: true
  })
}

const MAX_WAIT_MS = 60 * 60 * 1000 // 1 hour

async function handleWait(
  _ctx: ActionContext,
  params: Record<string, unknown>
): Promise<void> {
  const duration = Number(params.duration)
  const unit = String(params.unit || "seconds")

  if (!duration || duration <= 0) {
    throw new Error("duration must be a positive number")
  }

  const multipliers: Record<string, number> = {
    seconds: 1000,
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000
  }

  const multiplier = multipliers[unit] || 1000
  const ms = Math.min(duration * multiplier, MAX_WAIT_MS)

  logger.info("ActionExecutor: Waiting %dms before next action", ms)
  await new Promise((resolve) => setTimeout(resolve, ms))
}

const ACTION_HANDLERS: Record<string, ActionHandler> = {
  send_message: handleSendMessage,
  assign_agent: handleAssignAgent,
  add_tag: handleAddTag,
  remove_tag: handleRemoveTag,
  close_ticket: (ctx) => handleCloseTicket(ctx),
  reopen_ticket: (ctx) => handleReopenTicket(ctx),
  send_webhook: handleSendWebhook,
  send_notification: handleSendNotification,
  create_opportunity: handleCreateOpportunity,
  send_media: handleSendMedia,
  wait: handleWait
}

export async function executeActions(
  actions: MacroAction[],
  context: ActionContext
): Promise<ExecutionResult> {
  const results: ActionResult[] = []

  for (const action of actions) {
    const handler = ACTION_HANDLERS[action.type]
    if (!handler) {
      results.push({
        type: action.type,
        success: false,
        error: `Unknown action type: ${action.type}`
      })
      continue
    }

    try {
      await handler(context, action.params)
      results.push({ type: action.type, success: true })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error"

      logger.error(
        "ActionExecutor: Action %s failed for ticket %d: %s",
        action.type,
        context.ticketId,
        errorMessage
      )

      results.push({
        type: action.type,
        success: false,
        error: errorMessage
      })
    }
  }

  const succeeded = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  return { totalActions: actions.length, succeeded, failed, results }
}

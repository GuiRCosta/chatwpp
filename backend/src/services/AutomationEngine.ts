import AutomationRule from "../models/AutomationRule"
import Message from "../models/Message"
import Ticket from "../models/Ticket"
import Contact from "../models/Contact"
import { getRedisClient } from "../config/redis"
import { evaluateConditions } from "./ConditionEvaluator"
import * as ActionExecutor from "./ActionExecutor"
import { logger } from "../helpers/logger"
import type { EvaluationContext } from "./ConditionEvaluator"

const CACHE_TTL_SECONDS = 60

interface AutomationJobData {
  tenantId: number
  eventName: string
  ticketId: number
  messageId?: number
}

async function getCachedRules(
  tenantId: number,
  eventName: string
): Promise<AutomationRule[]> {
  const redis = getRedisClient()
  const cacheKey = `automation_rules:${tenantId}:${eventName}`

  const cached = await redis.get(cacheKey)
  if (cached) {
    return JSON.parse(cached)
  }

  const rules = await AutomationRule.findAll({
    where: { tenantId, eventName, isActive: true },
    order: [["id", "ASC"]]
  })

  const plain = rules.map((r) => r.toJSON())
  await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(plain))

  return plain as AutomationRule[]
}

interface BuildContextResult {
  context: EvaluationContext
  whatsappId: number | undefined
}

async function buildContext(
  ticketId: number,
  messageId?: number
): Promise<BuildContextResult> {
  const context: EvaluationContext = {}
  let whatsappId: number | undefined

  const ticket = await Ticket.findByPk(ticketId, {
    include: [
      { model: Contact, as: "contact", attributes: ["id", "name", "number", "isGroup"] }
    ]
  })

  if (ticket) {
    whatsappId = ticket.whatsappId
    context.ticket = {
      status: ticket.status,
      channel: ticket.channel,
      isGroup: ticket.isGroup
    }

    if (ticket.contact) {
      context.contact = {
        name: ticket.contact.name,
        number: ticket.contact.number,
        isGroup: ticket.contact.isGroup
      }
    }
  }

  if (messageId) {
    const message = await Message.findByPk(messageId)
    if (message) {
      context.message = {
        body: message.body,
        fromMe: message.fromMe,
        mediaType: message.mediaType || undefined
      }
    }
  }

  return { context, whatsappId }
}

export async function processAutomation(data: AutomationJobData): Promise<void> {
  const { tenantId, eventName, ticketId, messageId } = data

  if (messageId) {
    const message = await Message.findByPk(messageId)
    if (message?.automationRuleId) {
      logger.debug(
        "AutomationEngine: Skipping message %d — created by automation rule %d",
        messageId,
        message.automationRuleId
      )
      return
    }
  }

  const rules = await getCachedRules(tenantId, eventName)
  if (rules.length === 0) return

  const { context, whatsappId: ticketWhatsappId } = await buildContext(ticketId, messageId)

  for (const rule of rules) {
    try {
      const ruleWhatsappIds = rule.whatsappIds
      if (
        ruleWhatsappIds &&
        ruleWhatsappIds.length > 0 &&
        ticketWhatsappId &&
        !ruleWhatsappIds.includes(ticketWhatsappId)
      ) {
        continue
      }

      const matches = evaluateConditions(rule.conditions, context)
      if (!matches) continue

      logger.info(
        "AutomationEngine: Rule '%s' (id=%d) matched for ticket %d (event=%s)",
        rule.name,
        rule.id,
        ticketId,
        eventName
      )

      await ActionExecutor.executeActions(rule.actions, {
        ticketId,
        tenantId,
        userId: 0,
        automationRuleId: rule.id
      })
    } catch (error) {
      logger.error(
        "AutomationEngine: Error processing rule '%s' (id=%d): %o",
        rule.name,
        rule.id,
        error
      )
    }
  }
}

export async function invalidateRulesCache(tenantId: number): Promise<void> {
  const redis = getRedisClient()
  const pattern = `automation_rules:${tenantId}:*`

  const keys = await redis.keys(pattern)
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}

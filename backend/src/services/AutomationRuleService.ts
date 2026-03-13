import { Op } from "sequelize"

import AutomationRule from "../models/AutomationRule"
import { AppError } from "../helpers/AppError"
import { emitToTenant } from "../libs/socket"
import { invalidateRulesCache } from "./AutomationEngine"
import type { AutomationCondition, AutomationAction } from "../models/AutomationRule"

interface ListParams {
  tenantId: number
  searchParam?: string
  eventName?: string
}

export const listAutomationRules = async ({
  tenantId,
  searchParam = "",
  eventName
}: ListParams): Promise<AutomationRule[]> => {
  const where: Record<string, unknown> = { tenantId }

  if (searchParam) {
    where.name = { [Op.iLike]: `%${searchParam}%` }
  }

  if (eventName) {
    where.eventName = eventName
  }

  return AutomationRule.findAll({
    where,
    order: [["name", "ASC"]]
  })
}

export const findAutomationRuleById = async (
  id: number,
  tenantId: number
): Promise<AutomationRule> => {
  const rule = await AutomationRule.findOne({
    where: { id, tenantId }
  })

  if (!rule) {
    throw new AppError("Automation rule not found", 404)
  }

  return rule
}

export const createAutomationRule = async (
  tenantId: number,
  data: {
    name: string
    description?: string | null
    eventName: string
    conditions: AutomationCondition[]
    actions: AutomationAction[]
  }
): Promise<AutomationRule> => {
  const existing = await AutomationRule.findOne({
    where: { name: { [Op.iLike]: data.name }, tenantId }
  })
  if (existing) {
    throw new AppError("An automation rule with this name already exists", 409)
  }

  const rule = await AutomationRule.create({
    tenantId,
    name: data.name,
    description: data.description || null,
    eventName: data.eventName,
    conditions: data.conditions,
    actions: data.actions
  })

  await invalidateRulesCache(tenantId)

  emitToTenant(tenantId, "automationRule:created", rule)
  return rule
}

export const updateAutomationRule = async (
  id: number,
  tenantId: number,
  data: {
    name?: string
    description?: string | null
    eventName?: string
    conditions?: AutomationCondition[]
    actions?: AutomationAction[]
    isActive?: boolean
  }
): Promise<AutomationRule> => {
  const rule = await AutomationRule.findOne({ where: { id, tenantId } })
  if (!rule) {
    throw new AppError("Automation rule not found", 404)
  }

  if (data.name) {
    const existing = await AutomationRule.findOne({
      where: {
        name: { [Op.iLike]: data.name },
        tenantId,
        id: { [Op.ne]: id }
      }
    })
    if (existing) {
      throw new AppError("An automation rule with this name already exists", 409)
    }
  }

  await rule.update(data)

  await invalidateRulesCache(tenantId)

  const updated = await AutomationRule.findByPk(id)
  emitToTenant(tenantId, "automationRule:updated", updated)
  return updated!
}

export const deleteAutomationRule = async (
  id: number,
  tenantId: number
): Promise<void> => {
  const rule = await AutomationRule.findOne({ where: { id, tenantId } })
  if (!rule) {
    throw new AppError("Automation rule not found", 404)
  }

  await rule.destroy()

  await invalidateRulesCache(tenantId)

  emitToTenant(tenantId, "automationRule:deleted", { id })
}

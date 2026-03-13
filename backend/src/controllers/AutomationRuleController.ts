import { Request, Response } from "express"
import * as AutomationRuleService from "../services/AutomationRuleService"
import {
  createAutomationRuleSchema,
  updateAutomationRuleSchema
} from "../validators/AutomationRuleValidator"
import type { AutomationCondition, AutomationAction } from "../models/AutomationRule"

export const index = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { tenantId } = req
  const { searchParam, eventName } = req.query

  const rules = await AutomationRuleService.listAutomationRules({
    tenantId,
    searchParam: String(searchParam || ""),
    eventName: eventName ? String(eventName) : undefined
  })

  return res.json({ success: true, data: rules })
}

export const show = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const rule = await AutomationRuleService.findAutomationRuleById(
    Number(id),
    tenantId
  )

  return res.json({ success: true, data: rule })
}

export const store = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { tenantId } = req

  const validated = await createAutomationRuleSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const rule = await AutomationRuleService.createAutomationRule(
    tenantId,
    validated as {
      name: string
      description?: string | null
      eventName: string
      conditions: AutomationCondition[]
      actions: AutomationAction[]
    }
  )

  return res.status(201).json({ success: true, data: rule })
}

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const validated = await updateAutomationRuleSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const rule = await AutomationRuleService.updateAutomationRule(
    Number(id),
    tenantId,
    validated as {
      name?: string
      description?: string | null
      eventName?: string
      conditions?: AutomationCondition[]
      actions?: AutomationAction[]
      isActive?: boolean
    }
  )

  return res.json({ success: true, data: rule })
}

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  await AutomationRuleService.deleteAutomationRule(
    Number(id),
    tenantId
  )

  return res.json({
    success: true,
    data: { message: "Automation rule deleted successfully" }
  })
}

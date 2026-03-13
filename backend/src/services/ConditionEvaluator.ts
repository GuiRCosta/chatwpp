import type { AutomationCondition } from "../models/AutomationRule"

export interface EvaluationContext {
  ticket?: {
    status?: string
    channel?: string
    isGroup?: boolean
  }
  contact?: {
    name?: string
    number?: string
    isGroup?: boolean
  }
  message?: {
    body?: string
    fromMe?: boolean
    mediaType?: string
  }
}

function resolveAttribute(context: EvaluationContext, attribute: string): unknown {
  const [entity, field] = attribute.split(".")
  if (!entity || !field) return undefined

  const entityData = context[entity as keyof EvaluationContext]
  if (!entityData) return undefined

  return (entityData as Record<string, unknown>)[field]
}

function isPresent(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === "string" && value.trim() === "") return false
  return true
}

function evaluateSingleCondition(
  condition: AutomationCondition,
  context: EvaluationContext
): boolean {
  const actualValue = resolveAttribute(context, condition.attribute)

  switch (condition.operator) {
    case "is_present":
      return isPresent(actualValue)

    case "is_not_present":
      return !isPresent(actualValue)

    case "equal_to":
      return String(actualValue ?? "").toLowerCase() === String(condition.value ?? "").toLowerCase()

    case "not_equal_to":
      return String(actualValue ?? "").toLowerCase() !== String(condition.value ?? "").toLowerCase()

    case "contains":
      return String(actualValue ?? "").toLowerCase().includes(String(condition.value ?? "").toLowerCase())

    case "does_not_contain":
      return !String(actualValue ?? "").toLowerCase().includes(String(condition.value ?? "").toLowerCase())

    default:
      return false
  }
}

export function evaluateConditions(
  conditions: AutomationCondition[],
  context: EvaluationContext
): boolean {
  if (conditions.length === 0) return true

  let result = evaluateSingleCondition(conditions[0], context)

  for (let i = 1; i < conditions.length; i++) {
    const condition = conditions[i]
    const conditionResult = evaluateSingleCondition(condition, context)

    if (condition.queryOperator === "OR") {
      result = result || conditionResult
    } else {
      result = result && conditionResult
    }
  }

  return result
}

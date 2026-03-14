import * as yup from "yup"

const validEvents = [
  "conversation_created",
  "conversation_updated",
  "message_created"
]

const validOperators = [
  "equal_to",
  "not_equal_to",
  "contains",
  "does_not_contain",
  "is_present",
  "is_not_present"
]

const actionTypes = [
  "send_message",
  "assign_agent",
  "add_tag",
  "remove_tag",
  "close_ticket",
  "reopen_ticket",
  "send_webhook",
  "send_notification",
  "create_opportunity",
  "send_media",
  "wait"
]

const conditionSchema = yup.object().shape({
  attribute: yup.string().required("Condition attribute is required"),
  operator: yup
    .string()
    .oneOf(validOperators, "Invalid condition operator")
    .required("Condition operator is required"),
  value: yup.mixed().nullable(),
  queryOperator: yup
    .string()
    .oneOf(["AND", "OR"])
    .default("AND")
})

const actionSchema = yup.object().shape({
  type: yup
    .string()
    .oneOf(actionTypes, "Invalid action type")
    .required("Action type is required"),
  params: yup
    .mixed()
    .test(
      "is-object",
      "Action params must be an object",
      (val) => val !== null && typeof val === "object" && !Array.isArray(val)
    )
    .required("Action params are required")
})

export const createAutomationRuleSchema = yup.object().shape({
  name: yup.string().min(1).max(255).required("Name is required"),
  description: yup.string().max(1000).nullable(),
  eventName: yup
    .string()
    .oneOf(validEvents, "Invalid event name")
    .required("Event name is required"),
  conditions: yup
    .array()
    .of(conditionSchema)
    .max(10, "Maximum 10 conditions allowed")
    .default([]),
  actions: yup
    .array()
    .of(actionSchema)
    .min(1, "At least one action is required")
    .max(20, "Maximum 20 actions allowed")
    .required("Actions are required"),
  whatsappIds: yup
    .array()
    .of(yup.number().integer().positive())
    .nullable()
})

export const updateAutomationRuleSchema = yup.object().shape({
  name: yup.string().min(1).max(255),
  description: yup.string().max(1000).nullable(),
  eventName: yup.string().oneOf(validEvents, "Invalid event name"),
  conditions: yup
    .array()
    .of(conditionSchema)
    .max(10, "Maximum 10 conditions allowed"),
  actions: yup
    .array()
    .of(actionSchema)
    .min(1, "At least one action is required")
    .max(20, "Maximum 20 actions allowed"),
  isActive: yup.boolean(),
  whatsappIds: yup
    .array()
    .of(yup.number().integer().positive())
    .nullable()
})

import * as yup from "yup"

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
  "send_media"
]

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

export const createMacroSchema = yup.object().shape({
  name: yup.string().min(1).max(255).required("Name is required"),
  description: yup.string().max(1000).nullable(),
  actions: yup
    .array()
    .of(actionSchema)
    .min(1, "At least one action is required")
    .max(20, "Maximum 20 actions allowed")
    .required("Actions are required"),
  visibility: yup
    .string()
    .oneOf(["personal", "global"])
    .required("Visibility is required")
})

export const updateMacroSchema = yup.object().shape({
  name: yup.string().min(1).max(255),
  description: yup.string().max(1000).nullable(),
  actions: yup
    .array()
    .of(actionSchema)
    .min(1, "At least one action is required")
    .max(20, "Maximum 20 actions allowed"),
  visibility: yup.string().oneOf(["personal", "global"]),
  isActive: yup.boolean()
})

export const executeMacroSchema = yup.object().shape({
  ticketIds: yup
    .array()
    .of(yup.number().integer().positive().required())
    .min(1, "At least one ticket is required")
    .max(50, "Maximum 50 tickets per execution")
    .required("Ticket IDs are required")
})

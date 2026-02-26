import * as yup from "yup"

export const createOpportunitySchema = yup.object().shape({
  contactId: yup.number().integer().required("Contact ID is required"),
  pipelineId: yup.number().integer().required("Pipeline ID is required"),
  stageId: yup.number().integer().required("Stage ID is required"),
  value: yup.number().min(0, "Value must be at least 0").optional(),
  status: yup.string().oneOf(["open", "won", "lost"], "Invalid status").optional()
})

export const updateOpportunitySchema = yup.object().shape({
  contactId: yup.number().integer().optional(),
  pipelineId: yup.number().integer().optional(),
  stageId: yup.number().integer().optional(),
  value: yup.number().min(0, "Value must be at least 0").optional(),
  status: yup.string().oneOf(["open", "won", "lost"], "Invalid status").optional()
})

export const moveOpportunitySchema = yup.object().shape({
  stageId: yup.number().integer().required("Stage ID is required")
})

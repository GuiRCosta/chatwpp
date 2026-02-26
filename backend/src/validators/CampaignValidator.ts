import * as yup from "yup"

export const createCampaignSchema = yup.object().shape({
  name: yup.string().min(1).max(200).required("Name is required"),
  message: yup.string().required("Message is required"),
  whatsappId: yup.number().integer().required("WhatsApp ID is required"),
  mediaUrl: yup.string().url("Invalid URL").optional(),
  scheduledAt: yup.date().optional()
})

export const updateCampaignSchema = yup.object().shape({
  name: yup.string().min(1).max(200).optional(),
  message: yup.string().optional(),
  whatsappId: yup.number().integer().optional(),
  mediaUrl: yup.string().url("Invalid URL").optional(),
  scheduledAt: yup.date().optional()
})

export const addContactsSchema = yup.object().shape({
  contactIds: yup.array().of(yup.number().integer()).min(1, "At least one contact is required").required("Contact IDs are required")
})

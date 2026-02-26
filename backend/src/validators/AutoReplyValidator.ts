import * as yup from "yup"

export const createAutoReplySchema = yup.object().shape({
  name: yup.string().min(1).max(200).required("Name is required"),
  action: yup.string().min(1).max(100).required("Action is required"),
  isActive: yup.boolean()
})

export const updateAutoReplySchema = yup.object().shape({
  name: yup.string().min(1).max(200),
  action: yup.string().min(1).max(100),
  isActive: yup.boolean()
})

export const createStepSchema = yup.object().shape({
  stepOrder: yup.number().min(1).required("Step order is required"),
  message: yup.string().min(1).required("Message is required"),
  mediaUrl: yup.string(),
  action: yup.object().nullable()
})

export const updateStepSchema = yup.object().shape({
  stepOrder: yup.number().min(1),
  message: yup.string().min(1),
  mediaUrl: yup.string(),
  action: yup.object().nullable()
})

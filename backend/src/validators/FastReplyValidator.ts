import * as yup from "yup"

export const createFastReplySchema = yup.object().shape({
  key: yup.string().min(1).max(50).required("Key is required"),
  message: yup.string().min(1).required("Message is required"),
  mediaUrl: yup.string()
})

export const updateFastReplySchema = yup.object().shape({
  key: yup.string().min(1).max(50),
  message: yup.string().min(1),
  mediaUrl: yup.string()
})

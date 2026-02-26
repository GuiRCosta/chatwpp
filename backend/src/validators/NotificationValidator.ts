import * as yup from "yup"

export const createNotificationSchema = yup.object().shape({
  title: yup.string().max(200).required("Title is required"),
  message: yup.string().required("Message is required"),
  userId: yup.number().required("User ID is required")
})

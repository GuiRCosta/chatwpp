import * as yup from "yup"

export const createChatFlowSchema = yup.object().shape({
  name: yup.string().max(200).required("Name is required"),
  flow: yup.mixed(),
  isActive: yup.boolean()
})

export const updateChatFlowSchema = yup.object().shape({
  name: yup.string().max(200),
  flow: yup.mixed(),
  isActive: yup.boolean()
})

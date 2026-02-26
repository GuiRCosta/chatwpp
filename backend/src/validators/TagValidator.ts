import * as yup from "yup"

export const createTagSchema = yup.object().shape({
  name: yup.string().min(1).max(100).required("Name is required"),
  color: yup.string().max(20).required("Color is required")
})

export const updateTagSchema = yup.object().shape({
  name: yup.string().min(1).max(100),
  color: yup.string().max(20),
  isActive: yup.boolean()
})

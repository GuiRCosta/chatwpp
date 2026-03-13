import * as yup from "yup"

export const createPipelineSchema = yup.object().shape({
  name: yup.string().min(1).max(100).required("Name is required")
})

export const updatePipelineSchema = yup.object().shape({
  name: yup.string().min(1).max(100)
})

export const createStageSchema = yup.object().shape({
  name: yup.string().min(1).max(100).required("Name is required"),
  order: yup.number().integer().min(0).required("Order is required"),
  color: yup.string().max(7).optional()
})

export const updateStageSchema = yup.object().shape({
  name: yup.string().min(1).max(100),
  order: yup.number().integer().min(0),
  color: yup.string().max(7)
})

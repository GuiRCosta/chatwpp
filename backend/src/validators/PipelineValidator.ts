import * as yup from "yup"

export const createPipelineSchema = yup.object().shape({
  name: yup.string().min(1).max(100).required("Name is required")
})

export const updatePipelineSchema = yup.object().shape({
  name: yup.string().min(1).max(100)
})

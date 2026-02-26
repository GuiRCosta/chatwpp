import * as yup from "yup"

export const createKanbanSchema = yup.object().shape({
  name: yup.string().max(100).required("Name is required"),
  isActive: yup.boolean()
})

export const updateKanbanSchema = yup.object().shape({
  name: yup.string().max(100),
  isActive: yup.boolean()
})

export const createStageSchema = yup.object().shape({
  name: yup.string().max(100).required("Name is required"),
  order: yup.number().min(0).required("Order is required")
})

export const updateStageSchema = yup.object().shape({
  name: yup.string().max(100),
  order: yup.number().min(0)
})

export const reorderStagesSchema = yup.object().shape({
  stages: yup.array().of(
    yup.object().shape({
      id: yup.number().required("Stage ID is required"),
      order: yup.number().min(0).required("Order is required")
    })
  ).required("Stages array is required")
})

import * as yup from "yup"

export const createQueueSchema = yup.object().shape({
  name: yup.string().min(2).max(100).required("Name is required"),
  color: yup.string().max(20).required("Color is required"),
  greetingMessage: yup.string().nullable(),
  outOfHoursMessage: yup.string().nullable(),
  orderQueue: yup.number().integer().min(0).default(0)
})

export const updateQueueSchema = yup.object().shape({
  name: yup.string().min(2).max(100),
  color: yup.string().max(20),
  greetingMessage: yup.string().nullable(),
  outOfHoursMessage: yup.string().nullable(),
  orderQueue: yup.number().integer().min(0),
  isActive: yup.boolean()
})

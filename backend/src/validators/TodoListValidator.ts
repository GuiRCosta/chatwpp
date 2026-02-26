import * as yup from "yup"

export const createTodoListSchema = yup.object().shape({
  title: yup.string().min(1).max(200).required("Title is required"),
  description: yup.string(),
  dueDate: yup.date()
})

export const updateTodoListSchema = yup.object().shape({
  title: yup.string().min(1).max(200),
  description: yup.string(),
  dueDate: yup.date(),
  done: yup.boolean()
})

import * as yup from "yup"

export const createBanListSchema = yup.object().shape({
  number: yup.string().min(8).max(20).required("Number is required")
})

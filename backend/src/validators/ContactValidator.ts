import * as yup from "yup"

export const createContactSchema = yup.object().shape({
  name: yup.string().min(1).max(200).required("Name is required"),
  number: yup.string().max(50).required("Number is required"),
  email: yup.string().email("Invalid email").nullable(),
  isGroup: yup.boolean().default(false),
  customFields: yup.object().nullable()
})

export const updateContactSchema = yup.object().shape({
  name: yup.string().min(1).max(200),
  number: yup.string().max(50),
  email: yup.string().email("Invalid email").nullable(),
  profilePicUrl: yup.string().url().nullable(),
  telegramId: yup.string().nullable(),
  instagramId: yup.string().nullable(),
  facebookId: yup.string().nullable(),
  isGroup: yup.boolean(),
  customFields: yup.object().nullable(),
  walletId: yup.string().nullable()
})

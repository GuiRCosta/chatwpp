import * as yup from "yup"

export const createWhatsAppSchema = yup.object().shape({
  name: yup.string().min(2).max(100).required("Name is required"),
  type: yup.string().oneOf(["waba"]).default("waba"),
  wabaAccountId: yup.string().nullable(),
  wabaPhoneNumberId: yup.string().nullable(),
  wabaToken: yup.string().nullable(),
  number: yup.string().nullable(),
  greetingMessage: yup.string().nullable(),
  farewellMessage: yup.string().nullable(),
  isDefault: yup.boolean().default(false)
})

export const onboardFBLSchema = yup.object().shape({
  code: yup.string().required("Authorization code is required"),
  wabaId: yup.string()
    .matches(/^\d+$/, "WABA ID must be numeric")
    .required("WABA ID is required"),
  phoneNumberId: yup.string()
    .matches(/^\d+$/, "Phone number ID must be numeric")
    .required("Phone number ID is required"),
  name: yup.string().min(2).max(100).required("Connection name is required")
})

export const updateWhatsAppSchema = yup.object().shape({
  name: yup.string().min(2).max(100),
  wabaAccountId: yup.string().nullable(),
  wabaPhoneNumberId: yup.string().nullable(),
  wabaToken: yup.string().nullable(),
  wabaWebhookSecret: yup.string().nullable(),
  number: yup.string().nullable(),
  greetingMessage: yup.string().nullable(),
  farewellMessage: yup.string().nullable(),
  isDefault: yup.boolean(),
  status: yup.string().oneOf(["connected", "disconnected", "opening"])
})

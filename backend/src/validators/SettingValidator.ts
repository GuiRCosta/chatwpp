import * as yup from "yup"

export const updateSettingSchema = yup.object().shape({
  key: yup.string().required("Key is required"),
  value: yup.string().required("Value is required")
})

export const updateSettingsBulkSchema = yup.object().shape({
  settings: yup.array().of(
    yup.object().shape({
      key: yup.string().required("Key is required"),
      value: yup.string().required("Value is required")
    })
  ).min(1).required("Settings array is required")
})

import * as yup from "yup"

export const listTemplatesSchema = yup.object().shape({
  whatsappId: yup
    .number()
    .integer("whatsappId must be an integer")
    .positive("whatsappId must be positive")
    .nullable()
    .transform((value, original) =>
      original === "" || original === undefined ? undefined : value
    )
})

export const syncTemplatesSchema = yup.object().shape({
  whatsappId: yup
    .number()
    .integer("whatsappId must be an integer")
    .positive("whatsappId must be positive")
    .nullable()
    .transform((value, original) =>
      original === "" || original === undefined ? undefined : value
    )
})

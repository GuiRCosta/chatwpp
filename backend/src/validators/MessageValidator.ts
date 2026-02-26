import * as yup from "yup"

export const createMessageSchema = yup.object().shape({
  body: yup.string().when("mediaType", {
    is: (val: string | null | undefined) => !val,
    then: (schema) => schema.required("Message body is required"),
    otherwise: (schema) => schema.nullable()
  }),
  mediaUrl: yup.string().nullable(),
  mediaType: yup.string().nullable(),
  fromMe: yup.boolean().default(true),
  quotedMsgId: yup.string().nullable()
})

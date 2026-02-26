import * as yup from "yup"

export const createTicketSchema = yup.object().shape({
  contactId: yup.number().integer().required("Contact ID is required"),
  queueId: yup.number().integer().nullable(),
  whatsappId: yup.number().integer().nullable(),
  status: yup.string().oneOf(["open", "pending", "closed"]).default("pending"),
  channel: yup.string().nullable()
})

export const updateTicketSchema = yup.object().shape({
  userId: yup.number().integer().nullable(),
  queueId: yup.number().integer().nullable(),
  status: yup.string().oneOf(["open", "pending", "closed"]),
  isFarewellMessage: yup.boolean()
})

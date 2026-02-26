import * as yup from "yup"

export const createCallLogSchema = yup.object().shape({
  contactId: yup.number().required("Contact ID is required"),
  type: yup.string().oneOf(["incoming", "outgoing", "missed"]).required("Type is required"),
  duration: yup.number().min(0)
})

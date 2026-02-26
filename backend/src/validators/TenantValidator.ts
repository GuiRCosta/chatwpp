import * as yup from "yup"

export const createTenantSchema = yup.object().shape({
  name: yup.string().min(2).max(100).required("Name is required"),
  status: yup.string().oneOf(["active", "inactive", "trial"]).default("active"),
  maxUsers: yup.number().integer().min(1).default(99),
  maxConnections: yup.number().integer().min(1).default(99)
})

export const updateTenantSchema = yup.object().shape({
  name: yup.string().min(2).max(100),
  status: yup.string().oneOf(["active", "inactive", "trial"]),
  maxUsers: yup.number().integer().min(1),
  maxConnections: yup.number().integer().min(1),
  businessHours: yup.object().nullable(),
  settings: yup.object().nullable()
})

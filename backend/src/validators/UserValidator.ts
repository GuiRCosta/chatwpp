import * as yup from "yup"

const passwordSchema = yup
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .matches(/[a-z]/, "Password must contain at least one lowercase letter")
  .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
  .matches(/[0-9]/, "Password must contain at least one number")

export const createUserSchema = yup.object().shape({
  name: yup.string().min(2).max(100).required("Name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: passwordSchema.required("Password is required"),
  profile: yup.string().oneOf(["superadmin", "admin", "super", "user"]).default("user")
})

export const updateUserSchema = yup.object().shape({
  name: yup.string().min(2).max(100),
  email: yup.string().email("Invalid email"),
  password: passwordSchema,
  profile: yup.string().oneOf(["superadmin", "admin", "super", "user"]),
  configs: yup.object().nullable()
})

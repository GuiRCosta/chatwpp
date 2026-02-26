import * as yup from "yup"

export const createUserSchema = yup.object().shape({
  name: yup.string().min(2).max(100).required("Name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
  profile: yup.string().oneOf(["superadmin", "admin", "super", "user"]).default("user")
})

export const updateUserSchema = yup.object().shape({
  name: yup.string().min(2).max(100),
  email: yup.string().email("Invalid email"),
  password: yup.string().min(6, "Password must be at least 6 characters"),
  profile: yup.string().oneOf(["superadmin", "admin", "super", "user"]),
  configs: yup.object().nullable()
})

import * as yup from "yup"

export const loginSchema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().min(8, "Password must be at least 8 characters").required("Password is required")
})

export const refreshSchema = yup.object().shape({
  refreshToken: yup.string().required("Refresh token is required")
})

export const forgotPasswordSchema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email is required")
})

export const resetPasswordSchema = yup.object().shape({
  token: yup.string().required("Token is required"),
  password: yup.string().min(8, "Password must be at least 8 characters").required("Password is required")
})

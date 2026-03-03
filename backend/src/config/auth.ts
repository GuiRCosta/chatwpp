const secret = process.env.JWT_SECRET
const refreshSecret = process.env.JWT_REFRESH_SECRET

if (!secret || secret === "change-this-secret-in-production") {
  throw new Error(
    "FATAL: JWT_SECRET is not configured. Set a strong random value in environment variables."
  )
}

if (!refreshSecret || refreshSecret === "change-this-refresh-secret") {
  throw new Error(
    "FATAL: JWT_REFRESH_SECRET is not configured. Set a strong random value in environment variables."
  )
}

export default {
  secret,
  refreshSecret,
  expiresIn: "15m",
  refreshExpiresIn: "7d"
}

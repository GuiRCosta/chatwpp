export default {
  secret: process.env.JWT_SECRET || "change-this-secret-in-production",
  refreshSecret: process.env.JWT_REFRESH_SECRET || "change-this-refresh-secret",
  expiresIn: "15m",
  refreshExpiresIn: "7d"
}

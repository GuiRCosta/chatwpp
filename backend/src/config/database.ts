import dotenv from "dotenv"

dotenv.config()

const dbConfig = {
  dialect: "postgres" as const,
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "postgres",
  database: process.env.POSTGRES_DB || "zflow",
  define: {
    charset: "utf8mb4",
    collate: "utf8mb4_bin"
  },
  dialectOptions: {
    charset: "utf8mb4",
    ssl: process.env.DB_SSL === "true"
      ? { require: true, rejectUnauthorized: false }
      : undefined
  },
  logging: process.env.DB_LOGGING === "true" ? console.log : false,
  pool: {
    max: 20,
    min: 5,
    idle: 10000,
    acquire: 30000,
    evict: 10000
  },
  timezone: "UTC"
}

export default dbConfig

module.exports = dbConfig

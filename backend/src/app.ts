import "express-async-errors"
import "reflect-metadata"
import express from "express"
import cors from "cors"
import helmet from "helmet"
import cookieParser from "cookie-parser"
import rateLimit from "express-rate-limit"
import path from "path"

import { appRoutes } from "./routes"
import { errorHandler } from "./middleware/errorHandler"
import { setupBullBoard } from "./libs/bullBoard"

const app = express()

app.use(
  cors({
    credentials: true,
    origin: process.env.FRONTEND_URL || "http://localhost:7564"
  })
)

app.use(helmet())
app.use(cookieParser())
app.use(
  express.json({
    limit: "50mb",
    verify: (req: express.Request, _res, buf) => {
      (req as express.Request & { rawBody?: Buffer }).rawBody = buf
    }
  })
)
app.use(express.urlencoded({ extended: true, limit: "50mb" }))

app.use(
  "/public",
  express.static(path.resolve(__dirname, "..", "public"))
)

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 300,
  message: { error: "Too many requests, please try again later." }
})
app.use(limiter)

const bullBoardAdapter = setupBullBoard()
app.use("/admin/queues", bullBoardAdapter.getRouter())

app.use(appRoutes)
app.use(errorHandler)

export default app

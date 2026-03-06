import { Router } from "express"
import rateLimit from "express-rate-limit"

import upload from "../config/upload"
import * as UploadController from "../controllers/UploadController"

const uploadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many uploads. Try again later." }
})

const uploadRoutes = Router()

uploadRoutes.post("/", uploadLimiter, upload.single("media"), UploadController.store)

export { uploadRoutes }

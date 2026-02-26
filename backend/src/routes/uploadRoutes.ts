import { Router } from "express"

import upload from "../config/upload"
import * as UploadController from "../controllers/UploadController"

const uploadRoutes = Router()

uploadRoutes.post("/", upload.single("media"), UploadController.store)

export { uploadRoutes }

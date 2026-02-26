import { Request, Response } from "express"
import path from "path"
import fs from "fs"

import { AppError } from "../helpers/AppError"
import { publicFolder } from "../config/upload"

function getMediaType(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType.startsWith("video/")) return "video"
  if (mimeType.startsWith("audio/")) return "audio"
  return "document"
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  if (!req.file) {
    throw new AppError("No file uploaded", 400)
  }

  const { tenantId } = req
  const tenantDir = path.join(publicFolder, String(tenantId))

  if (!fs.existsSync(tenantDir)) {
    fs.mkdirSync(tenantDir, { recursive: true })
  }

  const srcPath = req.file.path
  const destPath = path.join(tenantDir, req.file.filename)
  fs.renameSync(srcPath, destPath)

  const mediaUrl = `${tenantId}/${req.file.filename}`
  const mediaType = getMediaType(req.file.mimetype)

  return res.status(201).json({
    success: true,
    data: {
      mediaUrl,
      mediaType,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size
    }
  })
}

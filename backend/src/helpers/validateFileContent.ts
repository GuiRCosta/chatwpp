import fs from "fs"
import { fromFile } from "file-type"
import { AppError } from "./AppError"

const MIME_CATEGORY_MAP: Record<string, string[]> = {
  "image/jpeg": ["image/jpeg"],
  "image/png": ["image/png"],
  "image/gif": ["image/gif"],
  "image/webp": ["image/webp"],
  "video/mp4": ["video/mp4"],
  "video/quicktime": ["video/quicktime"],
  "audio/mpeg": ["audio/mpeg"],
  "audio/ogg": ["audio/ogg", "application/ogg"],
  "audio/wav": ["audio/wav", "audio/x-wav"],
  "audio/webm": ["audio/webm", "video/webm"],
  "application/pdf": ["application/pdf"],
  "application/msword": ["application/msword", "application/x-cfb"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip"
  ],
  "application/vnd.ms-excel": ["application/vnd.ms-excel", "application/x-cfb"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip"
  ]
}

const TEXT_BASED_MIMES = ["text/plain", "text/csv"]

export async function validateFileContent(
  filePath: string,
  declaredMime: string
): Promise<void> {
  if (TEXT_BASED_MIMES.includes(declaredMime)) {
    return
  }

  let detected: { mime: string; ext: string } | undefined

  try {
    detected = await fromFile(filePath)
  } catch {
    fs.unlinkSync(filePath)
    throw new AppError("Unable to verify file content type", 400)
  }

  if (!detected) {
    fs.unlinkSync(filePath)
    throw new AppError("Unable to verify file content type", 400)
  }

  const allowedReal = MIME_CATEGORY_MAP[declaredMime]

  if (!allowedReal || !allowedReal.includes(detected.mime)) {
    fs.unlinkSync(filePath)
    throw new AppError(
      `File content (${detected.mime}) does not match declared type (${declaredMime})`,
      400
    )
  }
}

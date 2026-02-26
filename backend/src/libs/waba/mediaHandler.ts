import path from "path"
import fs from "fs"
import crypto from "crypto"
import { getMediaUrl, downloadMedia } from "./wabaClient"
import logger from "../../helpers/logger"

const UPLOAD_DIR = path.resolve(__dirname, "..", "..", "..", "public")

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "video/mp4": ".mp4",
  "video/3gpp": ".3gp",
  "audio/aac": ".aac",
  "audio/mpeg": ".mp3",
  "audio/amr": ".amr",
  "audio/ogg": ".ogg",
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx"
}

function getExtension(mimeType: string): string {
  return MIME_TO_EXT[mimeType] || ".bin"
}

function getMediaType(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType.startsWith("video/")) return "video"
  if (mimeType.startsWith("audio/")) return "audio"
  return "document"
}

export async function downloadAndSaveMedia(
  mediaId: string,
  token: string,
  tenantId: number
): Promise<{ localPath: string; mediaType: string; mimeType: string }> {
  const mediaInfo = await getMediaUrl(mediaId, token)
  const buffer = await downloadMedia(mediaInfo.url, token)

  const tenantDir = path.join(UPLOAD_DIR, String(tenantId))

  if (!fs.existsSync(tenantDir)) {
    fs.mkdirSync(tenantDir, { recursive: true })
  }

  const hash = crypto.randomBytes(16).toString("hex")
  const ext = getExtension(mediaInfo.mime_type)
  const filename = `${hash}${ext}`
  const filePath = path.join(tenantDir, filename)

  fs.writeFileSync(filePath, buffer)

  logger.info("Media saved: %s (%s, %d bytes)", filename, mediaInfo.mime_type, buffer.length)

  return {
    localPath: `${tenantId}/${filename}`,
    mediaType: getMediaType(mediaInfo.mime_type),
    mimeType: mediaInfo.mime_type
  }
}

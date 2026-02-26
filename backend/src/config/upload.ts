import multer from "multer"
import path from "path"
import crypto from "crypto"

const publicFolder = path.resolve(__dirname, "..", "..", "public")

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, publicFolder)
  },
  filename: (_req, file, cb) => {
    const hash = crypto.randomBytes(16).toString("hex")
    const ext = path.extname(file.originalname)
    const fileName = `${hash}${ext}`
    cb(null, fileName)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/quicktime",
      "audio/mpeg",
      "audio/ogg",
      "audio/wav",
      "audio/webm",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv"
    ]

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`))
    }
  }
})

export default upload
export { publicFolder }

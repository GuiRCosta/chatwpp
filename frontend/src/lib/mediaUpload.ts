import api from "./api"

interface UploadResult {
  mediaUrl: string
  mediaType: string
  originalName: string
  mimeType: string
  size: number
}

/** Upload a media file (audio, image, video, document) to the backend */
export async function uploadMedia(
  file: Blob,
  filename: string
): Promise<UploadResult> {
  const formData = new FormData()
  formData.append("media", file, filename)

  const response = await api.post<{ success: boolean; data: UploadResult }>(
    "/upload",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  )

  return response.data.data
}

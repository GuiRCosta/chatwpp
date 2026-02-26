import * as yup from "yup"

export const createGallerySchema = yup.object().shape({
  name: yup.string().max(200).required("Name is required"),
  mediaUrl: yup.string().required("Media URL is required"),
  mediaType: yup.string().oneOf(["image", "video", "audio", "document"], "Invalid media type").required("Media type is required")
})

export const updateGallerySchema = yup.object().shape({
  name: yup.string().max(200),
  mediaUrl: yup.string(),
  mediaType: yup.string().oneOf(["image", "video", "audio", "document"], "Invalid media type")
})

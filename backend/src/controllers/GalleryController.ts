import { Request, Response } from "express"

import * as GalleryService from "../services/GalleryService"
import { createGallerySchema, updateGallerySchema } from "../validators/GalleryValidator"

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { searchParam, mediaType } = req.query

  const galleries = await GalleryService.listGalleries({
    tenantId,
    searchParam: String(searchParam || ""),
    mediaType: mediaType ? String(mediaType) : undefined
  })

  return res.json({
    success: true,
    data: galleries
  })
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req

  const validated = await createGallerySchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const gallery = await GalleryService.createGallery(tenantId, validated)

  return res.status(201).json({
    success: true,
    data: gallery
  })
}

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const validated = await updateGallerySchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const gallery = await GalleryService.updateGallery(Number(id), tenantId, validated)

  return res.json({
    success: true,
    data: gallery
  })
}

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  await GalleryService.deleteGallery(Number(id), tenantId)

  return res.json({
    success: true,
    data: { message: "Gallery item deleted successfully" }
  })
}

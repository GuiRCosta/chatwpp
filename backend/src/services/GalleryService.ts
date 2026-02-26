import { Op } from "sequelize"

import Gallery from "../models/Gallery"
import { AppError } from "../helpers/AppError"
import { emitToTenant } from "../libs/socket"

interface ListParams {
  tenantId: number
  searchParam?: string
  mediaType?: string
}

export const listGalleries = async ({ tenantId, searchParam = "", mediaType }: ListParams): Promise<Gallery[]> => {
  const where: Record<string, unknown> = { tenantId }

  if (searchParam) {
    where.name = { [Op.iLike]: `%${searchParam}%` }
  }

  if (mediaType) {
    where.mediaType = mediaType
  }

  const galleries = await Gallery.findAll({
    where,
    order: [["name", "ASC"]]
  })

  return galleries
}

export const findGalleryById = async (id: number, tenantId: number): Promise<Gallery> => {
  const gallery = await Gallery.findOne({
    where: { id, tenantId }
  })

  if (!gallery) {
    throw new AppError("Gallery item not found", 404)
  }

  return gallery
}

export const createGallery = async (tenantId: number, data: {
  name: string
  mediaUrl: string
  mediaType: string
}): Promise<Gallery> => {
  const gallery = await Gallery.create({
    tenantId,
    name: data.name,
    mediaUrl: data.mediaUrl,
    mediaType: data.mediaType
  })

  emitToTenant(tenantId, "gallery:created", gallery)

  return gallery
}

export const updateGallery = async (id: number, tenantId: number, data: {
  name?: string
  mediaUrl?: string
  mediaType?: string
}): Promise<Gallery> => {
  const gallery = await Gallery.findOne({ where: { id, tenantId } })

  if (!gallery) {
    throw new AppError("Gallery item not found", 404)
  }

  await gallery.update(data)

  emitToTenant(tenantId, "gallery:updated", gallery)

  return gallery
}

export const deleteGallery = async (id: number, tenantId: number): Promise<void> => {
  const gallery = await Gallery.findOne({ where: { id, tenantId } })

  if (!gallery) {
    throw new AppError("Gallery item not found", 404)
  }

  await gallery.destroy()

  emitToTenant(tenantId, "gallery:deleted", { id })
}

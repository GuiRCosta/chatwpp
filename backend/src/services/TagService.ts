import { Op } from "sequelize"

import Tag from "../models/Tag"
import ContactTag from "../models/ContactTag"
import { AppError } from "../helpers/AppError"
import { emitToTenant } from "../libs/socket"

interface ListParams {
  tenantId: number
  searchParam?: string
}

export const listTags = async ({ tenantId, searchParam = "" }: ListParams): Promise<Tag[]> => {
  const where: Record<string, unknown> = { tenantId }

  if (searchParam) {
    where.name = { [Op.iLike]: `%${searchParam}%` }
  }

  const tags = await Tag.findAll({
    where,
    order: [["name", "ASC"]]
  })

  return tags
}

export const findTagById = async (id: number, tenantId: number): Promise<Tag> => {
  const tag = await Tag.findOne({
    where: { id, tenantId }
  })

  if (!tag) {
    throw new AppError("Tag not found", 404)
  }

  return tag
}

export const createTag = async (tenantId: number, data: {
  name: string
  color: string
}): Promise<Tag> => {
  const existingTag = await Tag.findOne({
    where: { name: { [Op.iLike]: data.name }, tenantId }
  })

  if (existingTag) {
    throw new AppError("A tag with this name already exists", 409)
  }

  const tag = await Tag.create({
    tenantId,
    name: data.name,
    color: data.color
  })

  emitToTenant(tenantId, "tag:created", tag)

  return tag
}

export const updateTag = async (id: number, tenantId: number, data: {
  name?: string
  color?: string
  isActive?: boolean
}): Promise<Tag> => {
  const tag = await Tag.findOne({ where: { id, tenantId } })

  if (!tag) {
    throw new AppError("Tag not found", 404)
  }

  if (data.name) {
    const existingTag = await Tag.findOne({
      where: {
        name: { [Op.iLike]: data.name },
        tenantId,
        id: { [Op.ne]: id }
      }
    })

    if (existingTag) {
      throw new AppError("A tag with this name already exists", 409)
    }
  }

  await tag.update(data)

  emitToTenant(tenantId, "tag:updated", tag)

  return tag
}

export const deleteTag = async (id: number, tenantId: number): Promise<void> => {
  const tag = await Tag.findOne({ where: { id, tenantId } })

  if (!tag) {
    throw new AppError("Tag not found", 404)
  }

  await ContactTag.destroy({ where: { tagId: id } })
  await tag.destroy()

  emitToTenant(tenantId, "tag:deleted", { id })
}

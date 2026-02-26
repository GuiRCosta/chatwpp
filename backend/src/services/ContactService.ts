import { Op } from "sequelize"

import Contact from "../models/Contact"
import ContactTag from "../models/ContactTag"
import Tag from "../models/Tag"
import Ticket from "../models/Ticket"
import { AppError } from "../helpers/AppError"
import { emitToTenant } from "../libs/socket"

interface ListParams {
  tenantId: number
  searchParam?: string
  pageNumber?: string | number
  limit?: string | number
  tags?: number[]
}

interface ListResult {
  contacts: Contact[]
  count: number
  hasMore: boolean
}

export const listContacts = async ({ tenantId, searchParam = "", pageNumber = "1", limit = "20", tags }: ListParams): Promise<ListResult> => {
  const offset = (Number(pageNumber) - 1) * Number(limit)

  const where: Record<string, unknown> = { tenantId }

  if (searchParam) {
    where[Op.or as unknown as string] = [
      { name: { [Op.iLike]: `%${searchParam}%` } },
      { number: { [Op.iLike]: `%${searchParam}%` } },
      { email: { [Op.iLike]: `%${searchParam}%` } }
    ]
  }

  const includeOptions: Array<Record<string, unknown>> = [
    {
      model: ContactTag,
      as: "contactTags",
      include: [{ model: Tag, as: "tag" }]
    }
  ]

  if (tags && tags.length > 0) {
    includeOptions[0].where = { tagId: { [Op.in]: tags } }
    includeOptions[0].required = true
  }

  const { rows: contacts, count } = await Contact.findAndCountAll({
    where,
    include: includeOptions,
    limit: Number(limit),
    offset,
    order: [["name", "ASC"]],
    distinct: true
  })

  const hasMore = count > offset + contacts.length

  return { contacts, count, hasMore }
}

export const findContactById = async (id: number, tenantId: number): Promise<Contact> => {
  const contact = await Contact.findOne({
    where: { id, tenantId },
    include: [
      { model: ContactTag, as: "contactTags", include: [{ model: Tag, as: "tag" }] },
      { model: Ticket, as: "tickets", limit: 5, order: [["updatedAt", "DESC"]] }
    ]
  })

  if (!contact) {
    throw new AppError("Contact not found", 404)
  }

  return contact
}

export const findContactByNumber = async (number: string, tenantId: number): Promise<Contact | null> => {
  return Contact.findOne({
    where: { number, tenantId }
  })
}

export const createContact = async (tenantId: number, data: {
  name: string
  number: string
  email?: string
  isGroup?: boolean
  customFields?: object
  tagIds?: number[]
}): Promise<Contact> => {
  const existingContact = await Contact.findOne({
    where: { number: data.number, tenantId }
  })

  if (existingContact) {
    throw new AppError("A contact with this number already exists", 409)
  }

  const contact = await Contact.create({
    tenantId,
    name: data.name,
    number: data.number,
    email: data.email || "",
    isGroup: data.isGroup || false,
    customFields: data.customFields || {}
  })

  if (data.tagIds && data.tagIds.length > 0) {
    const tagEntries = data.tagIds.map(tagId => ({
      contactId: contact.id,
      tagId
    }))
    await ContactTag.bulkCreate(tagEntries)
  }

  const createdContact = await findContactById(contact.id, tenantId)

  emitToTenant(tenantId, "contact:created", createdContact)

  return createdContact
}

export const updateContact = async (id: number, tenantId: number, data: {
  name?: string
  number?: string
  email?: string
  profilePicUrl?: string
  telegramId?: string
  instagramId?: string
  facebookId?: string
  isGroup?: boolean
  customFields?: object
  walletId?: string
  tagIds?: number[]
}): Promise<Contact> => {
  const contact = await Contact.findOne({ where: { id, tenantId } })

  if (!contact) {
    throw new AppError("Contact not found", 404)
  }

  if (data.number) {
    const existingContact = await Contact.findOne({
      where: {
        number: data.number,
        tenantId,
        id: { [Op.ne]: id }
      }
    })

    if (existingContact) {
      throw new AppError("A contact with this number already exists", 409)
    }
  }

  const { tagIds, ...updateData } = data

  await contact.update(updateData)

  if (tagIds !== undefined) {
    await ContactTag.destroy({ where: { contactId: id } })
    if (tagIds.length > 0) {
      const tagEntries = tagIds.map(tagId => ({
        contactId: id,
        tagId
      }))
      await ContactTag.bulkCreate(tagEntries)
    }
  }

  const updatedContact = await findContactById(id, tenantId)

  emitToTenant(tenantId, "contact:updated", updatedContact)

  return updatedContact
}

export const deleteContact = async (id: number, tenantId: number): Promise<void> => {
  const contact = await Contact.findOne({ where: { id, tenantId } })

  if (!contact) {
    throw new AppError("Contact not found", 404)
  }

  await ContactTag.destroy({ where: { contactId: id } })
  await contact.destroy()

  emitToTenant(tenantId, "contact:deleted", { id })
}

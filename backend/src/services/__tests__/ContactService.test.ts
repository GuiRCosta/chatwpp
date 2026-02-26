import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/models/Contact", () => ({
  default: {
    findOne: vi.fn(),
    findByPk: vi.fn(),
    findAndCountAll: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn()
  }
}))

vi.mock("@/models/ContactTag", () => ({
  default: {
    bulkCreate: vi.fn(),
    destroy: vi.fn()
  }
}))

vi.mock("@/models/Tag", () => ({
  default: {}
}))

vi.mock("@/models/Ticket", () => ({
  default: {}
}))

import {
  listContacts,
  findContactById,
  createContact,
  updateContact,
  deleteContact
} from "../ContactService"
import Contact from "@/models/Contact"
import ContactTag from "@/models/ContactTag"
import { buildContact } from "@/__tests__/factories"
import { AppError } from "@/helpers/AppError"

describe("ContactService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listContacts", () => {
    it("returns paginated contacts", async () => {
      const mockContacts = [
        buildContact({ id: 1, name: "Contact A" }),
        buildContact({ id: 2, name: "Contact B" })
      ]
      vi.mocked(Contact.findAndCountAll).mockResolvedValue({
        rows: mockContacts,
        count: 2
      } as any)

      const result = await listContacts({ tenantId: 1 })

      expect(result.contacts).toHaveLength(2)
      expect(result.count).toBe(2)
      expect(result.hasMore).toBe(false)
      expect(Contact.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 1 },
          limit: 20,
          offset: 0
        })
      )
    })
  })

  describe("findContactById", () => {
    it("returns a contact when found", async () => {
      const mockContact = buildContact({ id: 5 })
      vi.mocked(Contact.findOne).mockResolvedValue(mockContact as unknown as Contact)

      const result = await findContactById(5, 1)

      expect(result).toBeDefined()
      expect(Contact.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 5, tenantId: 1 }
        })
      )
    })

    it("throws AppError when contact is not found", async () => {
      vi.mocked(Contact.findOne).mockResolvedValue(null)

      await expect(findContactById(999, 1)).rejects.toThrow(AppError)
      await expect(findContactById(999, 1)).rejects.toThrow("Contact not found")
    })
  })

  describe("createContact", () => {
    it("creates a contact successfully", async () => {
      const createdContact = buildContact({ id: 10, name: "New Contact", number: "5511888888888" })

      vi.mocked(Contact.findOne)
        .mockResolvedValueOnce(null) // existingContact check
        .mockResolvedValueOnce(createdContact as unknown as Contact) // findContactById

      vi.mocked(Contact.create).mockResolvedValue(createdContact as unknown as Contact)

      const result = await createContact(1, {
        name: "New Contact",
        number: "5511888888888"
      })

      expect(result).toBeDefined()
      expect(Contact.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          name: "New Contact",
          number: "5511888888888"
        })
      )
    })

    it("creates tags when tagIds are provided", async () => {
      const createdContact = buildContact({ id: 10 })

      vi.mocked(Contact.findOne)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(createdContact as unknown as Contact)

      vi.mocked(Contact.create).mockResolvedValue(createdContact as unknown as Contact)

      await createContact(1, {
        name: "Tagged Contact",
        number: "5511777777777",
        tagIds: [1, 2]
      })

      expect(ContactTag.bulkCreate).toHaveBeenCalledWith([
        { contactId: 10, tagId: 1 },
        { contactId: 10, tagId: 2 }
      ])
    })

    it("throws error when contact number already exists", async () => {
      const existingContact = buildContact({ number: "5511999999999" })
      vi.mocked(Contact.findOne).mockResolvedValue(existingContact as unknown as Contact)

      await expect(
        createContact(1, {
          name: "Dup Contact",
          number: "5511999999999"
        })
      ).rejects.toThrow("A contact with this number already exists")
    })
  })

  describe("updateContact", () => {
    it("updates contact data successfully", async () => {
      const mockContact = buildContact({ id: 1 })

      vi.mocked(Contact.findOne)
        .mockResolvedValueOnce(mockContact as unknown as Contact) // initial find
        .mockResolvedValueOnce(null) // number uniqueness check
        .mockResolvedValueOnce(mockContact as unknown as Contact) // findContactById

      const result = await updateContact(1, 1, {
        name: "Updated Contact",
        number: "5511666666666"
      })

      expect(result).toBeDefined()
      expect(mockContact.update).toHaveBeenCalled()
    })
  })

  describe("deleteContact", () => {
    it("deletes a contact successfully", async () => {
      const mockContact = buildContact({ id: 1 })
      vi.mocked(Contact.findOne).mockResolvedValue(mockContact as unknown as Contact)

      await deleteContact(1, 1)

      expect(ContactTag.destroy).toHaveBeenCalledWith(
        expect.objectContaining({ where: { contactId: 1 } })
      )
      expect(mockContact.destroy).toHaveBeenCalled()
    })

    it("throws error when contact is not found", async () => {
      vi.mocked(Contact.findOne).mockResolvedValue(null)

      await expect(deleteContact(999, 1)).rejects.toThrow("Contact not found")
    })
  })
})

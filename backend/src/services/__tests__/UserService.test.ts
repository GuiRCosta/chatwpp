import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/models/User", () => ({
  default: {
    findOne: vi.fn(),
    findByPk: vi.fn(),
    findAndCountAll: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn()
  }
}))

vi.mock("@/models/Queue", () => ({
  default: {}
}))

vi.mock("@/models/UserQueue", () => ({
  default: {
    bulkCreate: vi.fn(),
    destroy: vi.fn()
  }
}))

vi.mock("@/models/Tenant", () => ({
  default: {
    findByPk: vi.fn()
  }
}))

vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("hashed-password")
}))

import {
  listUsers,
  findUserById,
  createUser,
  updateUser,
  deleteUser
} from "../UserService"
import User from "@/models/User"
import UserQueue from "@/models/UserQueue"
import Tenant from "@/models/Tenant"
import { buildUser, buildTenant } from "@/__tests__/factories"
import { AppError } from "@/helpers/AppError"

describe("UserService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listUsers", () => {
    it("returns paginated users", async () => {
      const mockUsers = [
        buildUser({ id: 1, name: "Alice" }),
        buildUser({ id: 2, name: "Bob" })
      ]
      vi.mocked(User.findAndCountAll).mockResolvedValue({
        rows: mockUsers,
        count: 2
      } as any)

      const result = await listUsers({ tenantId: 1 })

      expect(result.users).toHaveLength(2)
      expect(result.count).toBe(2)
      expect(result.hasMore).toBe(false)
      expect(User.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 1 },
          limit: 20,
          offset: 0
        })
      )
    })

    it("returns hasMore when there are more results", async () => {
      const mockUsers = [buildUser()]
      vi.mocked(User.findAndCountAll).mockResolvedValue({
        rows: mockUsers,
        count: 50
      } as any)

      const result = await listUsers({ tenantId: 1, limit: "1", pageNumber: "1" })

      expect(result.hasMore).toBe(true)
    })
  })

  describe("findUserById", () => {
    it("returns a user when found", async () => {
      const mockUser = buildUser({ id: 5, name: "Found User" })
      vi.mocked(User.findOne).mockResolvedValue(mockUser as unknown as User)

      const result = await findUserById(5, 1)

      expect(result).toBeDefined()
      expect(User.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 5, tenantId: 1 }
        })
      )
    })

    it("throws AppError when user is not found", async () => {
      vi.mocked(User.findOne).mockResolvedValue(null)

      await expect(findUserById(999, 1)).rejects.toThrow(AppError)
      await expect(findUserById(999, 1)).rejects.toThrow("User not found")
    })
  })

  describe("createUser", () => {
    it("creates a user successfully", async () => {
      vi.mocked(User.findOne).mockResolvedValue(null)
      const mockTenant = buildTenant({ maxUsers: 10 })
      vi.mocked(Tenant.findByPk).mockResolvedValue(mockTenant as any)
      vi.mocked(User.count).mockResolvedValue(2)

      const createdUser = buildUser({ id: 10, name: "New User", email: "new@test.com" })
      vi.mocked(User.create).mockResolvedValue(createdUser as unknown as User)

      // findUserById is called internally - mock the second findOne call
      vi.mocked(User.findOne)
        .mockResolvedValueOnce(null) // existingUser check
        .mockResolvedValueOnce(createdUser as unknown as User) // findUserById

      const result = await createUser(1, {
        name: "New User",
        email: "new@test.com",
        password: "secret123"
      })

      expect(result).toBeDefined()
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          name: "New User",
          email: "new@test.com"
        })
      )
    })

    it("throws error when email already exists", async () => {
      const existingUser = buildUser({ email: "dup@test.com" })
      vi.mocked(User.findOne).mockResolvedValue(existingUser as unknown as User)

      await expect(
        createUser(1, {
          name: "Duplicate",
          email: "dup@test.com",
          password: "secret123"
        })
      ).rejects.toThrow("A user with this email already exists")
    })
  })

  describe("updateUser", () => {
    it("updates user data successfully", async () => {
      const mockUser = buildUser({ id: 1 })
      vi.mocked(User.findOne)
        .mockResolvedValueOnce(mockUser as unknown as User) // initial find
        .mockResolvedValueOnce(null) // email uniqueness check (data.email present)
        .mockResolvedValueOnce(mockUser as unknown as User) // findUserById

      const result = await updateUser(1, 1, {
        name: "Updated Name",
        email: "updated@test.com"
      })

      expect(result).toBeDefined()
      expect(mockUser.update).toHaveBeenCalled()
    })
  })

  describe("deleteUser", () => {
    it("deletes user successfully", async () => {
      const mockUser = buildUser({ id: 1 })
      vi.mocked(User.findOne).mockResolvedValue(mockUser as unknown as User)

      await deleteUser(1, 1)

      expect(UserQueue.destroy).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 1 } })
      )
      expect(mockUser.destroy).toHaveBeenCalled()
    })

    it("throws error when user is not found", async () => {
      vi.mocked(User.findOne).mockResolvedValue(null)

      await expect(deleteUser(999, 1)).rejects.toThrow("User not found")
    })
  })
})

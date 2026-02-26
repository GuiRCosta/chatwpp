import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/models/Queue", () => ({
  default: {
    findOne: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn()
  }
}))

vi.mock("@/models/UserQueue", () => ({
  default: {
    bulkCreate: vi.fn(),
    destroy: vi.fn()
  }
}))

vi.mock("@/models/User", () => ({
  default: {}
}))

import {
  listQueues,
  findQueueById,
  createQueue,
  updateQueue,
  deleteQueue
} from "../QueueService"
import Queue from "@/models/Queue"
import UserQueue from "@/models/UserQueue"
import { buildQueue } from "@/__tests__/factories"
import { AppError } from "@/helpers/AppError"

describe("QueueService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listQueues", () => {
    it("returns queues for a tenant", async () => {
      const mockQueues = [
        buildQueue({ id: 1, name: "Queue A" }),
        buildQueue({ id: 2, name: "Queue B" })
      ]
      vi.mocked(Queue.findAll).mockResolvedValue(mockQueues as any)

      const result = await listQueues({ tenantId: 1 })

      expect(result).toHaveLength(2)
      expect(Queue.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 1 },
          order: [["orderQueue", "ASC"], ["name", "ASC"]]
        })
      )
    })

    it("filters by searchParam", async () => {
      vi.mocked(Queue.findAll).mockResolvedValue([])

      await listQueues({ tenantId: 1, searchParam: "support" })

      expect(Queue.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 1,
            name: expect.any(Object)
          })
        })
      )
    })
  })

  describe("findQueueById", () => {
    it("returns a queue when found", async () => {
      const mockQueue = buildQueue({ id: 5 })
      vi.mocked(Queue.findOne).mockResolvedValue(mockQueue as any)

      const result = await findQueueById(5, 1)

      expect(result).toBeDefined()
      expect(Queue.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 5, tenantId: 1 }
        })
      )
    })

    it("throws AppError when not found", async () => {
      vi.mocked(Queue.findOne).mockResolvedValue(null)

      await expect(findQueueById(999, 1)).rejects.toThrow(AppError)
      await expect(findQueueById(999, 1)).rejects.toThrow("Queue not found")
    })
  })

  describe("createQueue", () => {
    it("creates a queue successfully", async () => {
      vi.mocked(Queue.findOne)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(buildQueue({ id: 10 }) as any)

      const created = buildQueue({ id: 10, name: "New Queue" })
      vi.mocked(Queue.create).mockResolvedValue(created as any)

      const result = await createQueue(1, {
        name: "New Queue",
        color: "#ff0000"
      })

      expect(result).toBeDefined()
      expect(Queue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          name: "New Queue",
          color: "#ff0000"
        })
      )
    })

    it("creates user queue associations when userIds provided", async () => {
      vi.mocked(Queue.findOne)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(buildQueue({ id: 10 }) as any)

      const created = buildQueue({ id: 10 })
      vi.mocked(Queue.create).mockResolvedValue(created as any)

      await createQueue(1, {
        name: "Queue with Users",
        color: "#ff0000",
        userIds: [1, 2]
      })

      expect(UserQueue.bulkCreate).toHaveBeenCalledWith([
        { userId: 1, queueId: 10 },
        { userId: 2, queueId: 10 }
      ])
    })

    it("throws when name already exists", async () => {
      const existing = buildQueue({ name: "Support" })
      vi.mocked(Queue.findOne).mockResolvedValue(existing as any)

      await expect(
        createQueue(1, { name: "Support", color: "#ff0000" })
      ).rejects.toThrow("A queue with this name already exists")
    })
  })

  describe("updateQueue", () => {
    it("updates a queue successfully", async () => {
      const mockQueue = buildQueue({ id: 1 })
      vi.mocked(Queue.findOne)
        .mockResolvedValueOnce(mockQueue as any)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockQueue as any)

      const result = await updateQueue(1, 1, { name: "Updated Queue" })

      expect(result).toBeDefined()
      expect(mockQueue.update).toHaveBeenCalledWith({ name: "Updated Queue" })
    })

    it("replaces user associations when userIds provided", async () => {
      const mockQueue = buildQueue({ id: 1 })
      vi.mocked(Queue.findOne)
        .mockResolvedValueOnce(mockQueue as any)
        .mockResolvedValueOnce(mockQueue as any)

      await updateQueue(1, 1, { userIds: [3, 4] })

      expect(UserQueue.destroy).toHaveBeenCalledWith(
        expect.objectContaining({ where: { queueId: 1 } })
      )
      expect(UserQueue.bulkCreate).toHaveBeenCalledWith([
        { userId: 3, queueId: 1 },
        { userId: 4, queueId: 1 }
      ])
    })

    it("throws when not found", async () => {
      vi.mocked(Queue.findOne).mockResolvedValue(null)

      await expect(
        updateQueue(999, 1, { name: "Updated" })
      ).rejects.toThrow("Queue not found")
    })

    it("throws when new name conflicts", async () => {
      const mockQueue = buildQueue({ id: 1 })
      const conflicting = buildQueue({ id: 2, name: "Other" })

      vi.mocked(Queue.findOne)
        .mockResolvedValueOnce(mockQueue as any)
        .mockResolvedValueOnce(conflicting as any)

      await expect(
        updateQueue(1, 1, { name: "Other" })
      ).rejects.toThrow("A queue with this name already exists")
    })
  })

  describe("deleteQueue", () => {
    it("deletes a queue and its user associations", async () => {
      const mockQueue = buildQueue({ id: 1 })
      vi.mocked(Queue.findOne).mockResolvedValue(mockQueue as any)

      await deleteQueue(1, 1)

      expect(UserQueue.destroy).toHaveBeenCalledWith(
        expect.objectContaining({ where: { queueId: 1 } })
      )
      expect(mockQueue.destroy).toHaveBeenCalled()
    })

    it("throws when not found", async () => {
      vi.mocked(Queue.findOne).mockResolvedValue(null)

      await expect(deleteQueue(999, 1)).rejects.toThrow("Queue not found")
    })
  })
})

import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/models/TodoList", () => ({
  default: {
    findOne: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn()
  }
}))

import {
  listTodoLists,
  findTodoListById,
  createTodoList,
  updateTodoList,
  toggleTodoList,
  deleteTodoList
} from "../TodoListService"
import TodoList from "@/models/TodoList"
import { AppError } from "@/helpers/AppError"

function buildTodoList(overrides: Record<string, unknown> = {}) {
  const data = {
    id: 1,
    tenantId: 1,
    userId: 1,
    title: "Test Todo",
    description: "A test todo item",
    dueDate: new Date("2025-06-01"),
    done: false,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides
  }
  return {
    ...data,
    update: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn().mockResolvedValue(undefined)
  }
}

describe("TodoListService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listTodoLists", () => {
    it("returns todo lists for a tenant and user", async () => {
      const mockTodos = [
        buildTodoList({ id: 1, title: "Todo A" }),
        buildTodoList({ id: 2, title: "Todo B" })
      ]
      vi.mocked(TodoList.findAll).mockResolvedValue(mockTodos as any)

      const result = await listTodoLists({ tenantId: 1, userId: 1 })

      expect(result).toHaveLength(2)
      expect(TodoList.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 1, userId: 1 },
          order: [["dueDate", "ASC"]]
        })
      )
    })

    it("filters by done status", async () => {
      vi.mocked(TodoList.findAll).mockResolvedValue([])

      await listTodoLists({ tenantId: 1, userId: 1, done: false })

      expect(TodoList.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 1,
            userId: 1,
            done: false
          })
        })
      )
    })
  })

  describe("findTodoListById", () => {
    it("returns a todo list when found", async () => {
      const mockTodo = buildTodoList({ id: 5 })
      vi.mocked(TodoList.findOne).mockResolvedValue(mockTodo as any)

      const result = await findTodoListById(5, 1, 1)

      expect(result).toBeDefined()
      expect(TodoList.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 5, tenantId: 1, userId: 1 }
        })
      )
    })

    it("throws AppError when not found", async () => {
      vi.mocked(TodoList.findOne).mockResolvedValue(null)

      await expect(findTodoListById(999, 1, 1)).rejects.toThrow(AppError)
      await expect(findTodoListById(999, 1, 1)).rejects.toThrow("TodoList not found")
    })
  })

  describe("createTodoList", () => {
    it("creates a todo list successfully", async () => {
      const created = buildTodoList({ id: 10, title: "New Todo" })
      vi.mocked(TodoList.create).mockResolvedValue(created as any)

      const result = await createTodoList(1, 1, {
        title: "New Todo",
        description: "Description"
      })

      expect(result).toBeDefined()
      expect(TodoList.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 1,
          userId: 1,
          title: "New Todo",
          description: "Description"
        })
      )
    })
  })

  describe("updateTodoList", () => {
    it("updates a todo list successfully", async () => {
      const mockTodo = buildTodoList({ id: 1 })
      vi.mocked(TodoList.findOne).mockResolvedValue(mockTodo as any)

      const result = await updateTodoList(1, 1, 1, { title: "Updated Todo" })

      expect(result).toBeDefined()
      expect(mockTodo.update).toHaveBeenCalledWith({ title: "Updated Todo" })
    })

    it("throws when not found", async () => {
      vi.mocked(TodoList.findOne).mockResolvedValue(null)

      await expect(
        updateTodoList(999, 1, 1, { title: "Updated" })
      ).rejects.toThrow("TodoList not found")
    })
  })

  describe("toggleTodoList", () => {
    it("toggles done from false to true", async () => {
      const mockTodo = buildTodoList({ id: 1, done: false })
      vi.mocked(TodoList.findOne).mockResolvedValue(mockTodo as any)

      const result = await toggleTodoList(1, 1, 1)

      expect(result).toBeDefined()
      expect(mockTodo.update).toHaveBeenCalledWith({ done: true })
    })

    it("toggles done from true to false", async () => {
      const mockTodo = buildTodoList({ id: 1, done: true })
      vi.mocked(TodoList.findOne).mockResolvedValue(mockTodo as any)

      const result = await toggleTodoList(1, 1, 1)

      expect(result).toBeDefined()
      expect(mockTodo.update).toHaveBeenCalledWith({ done: false })
    })

    it("throws when not found", async () => {
      vi.mocked(TodoList.findOne).mockResolvedValue(null)

      await expect(toggleTodoList(999, 1, 1)).rejects.toThrow("TodoList not found")
    })
  })

  describe("deleteTodoList", () => {
    it("deletes a todo list successfully", async () => {
      const mockTodo = buildTodoList({ id: 1 })
      vi.mocked(TodoList.findOne).mockResolvedValue(mockTodo as any)

      await deleteTodoList(1, 1, 1)

      expect(mockTodo.destroy).toHaveBeenCalled()
    })

    it("throws when not found", async () => {
      vi.mocked(TodoList.findOne).mockResolvedValue(null)

      await expect(deleteTodoList(999, 1, 1)).rejects.toThrow("TodoList not found")
    })
  })
})

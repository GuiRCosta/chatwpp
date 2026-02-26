import TodoList from "../models/TodoList"
import { AppError } from "../helpers/AppError"
import { emitToTenant } from "../libs/socket"

interface ListParams {
  tenantId: number
  userId: number
  done?: boolean
}

export const listTodoLists = async ({ tenantId, userId, done }: ListParams): Promise<TodoList[]> => {
  const where: Record<string, unknown> = { tenantId, userId }

  if (done !== undefined) {
    where.done = done
  }

  const todoLists = await TodoList.findAll({
    where,
    order: [["dueDate", "ASC"]]
  })

  return todoLists
}

export const findTodoListById = async (id: number, tenantId: number, userId: number): Promise<TodoList> => {
  const todoList = await TodoList.findOne({
    where: { id, tenantId, userId }
  })

  if (!todoList) {
    throw new AppError("TodoList not found", 404)
  }

  return todoList
}

export const createTodoList = async (tenantId: number, userId: number, data: {
  title: string
  description?: string
  dueDate?: Date
}): Promise<TodoList> => {
  const todoList = await TodoList.create({
    tenantId,
    userId,
    title: data.title,
    description: data.description,
    dueDate: data.dueDate
  })

  emitToTenant(tenantId, "todolist:created", todoList)

  return todoList
}

export const updateTodoList = async (id: number, tenantId: number, userId: number, data: {
  title?: string
  description?: string
  dueDate?: Date
  done?: boolean
}): Promise<TodoList> => {
  const todoList = await TodoList.findOne({ where: { id, tenantId, userId } })

  if (!todoList) {
    throw new AppError("TodoList not found", 404)
  }

  await todoList.update(data)

  emitToTenant(tenantId, "todolist:updated", todoList)

  return todoList
}

export const toggleTodoList = async (id: number, tenantId: number, userId: number): Promise<TodoList> => {
  const todoList = await TodoList.findOne({ where: { id, tenantId, userId } })

  if (!todoList) {
    throw new AppError("TodoList not found", 404)
  }

  await todoList.update({ done: !todoList.done })

  emitToTenant(tenantId, "todolist:updated", todoList)

  return todoList
}

export const deleteTodoList = async (id: number, tenantId: number, userId: number): Promise<void> => {
  const todoList = await TodoList.findOne({ where: { id, tenantId, userId } })

  if (!todoList) {
    throw new AppError("TodoList not found", 404)
  }

  await todoList.destroy()

  emitToTenant(tenantId, "todolist:deleted", { id })
}

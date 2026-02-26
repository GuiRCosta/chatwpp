import { Request, Response } from "express"

import * as TodoListService from "../services/TodoListService"
import { createTodoListSchema, updateTodoListSchema } from "../validators/TodoListValidator"

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, userId } = req
  const { done } = req.query

  const todoLists = await TodoListService.listTodoLists({
    tenantId,
    userId,
    done: done !== undefined ? done === "true" : undefined
  })

  return res.json({
    success: true,
    data: todoLists
  })
}

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, userId } = req
  const { id } = req.params

  const todoList = await TodoListService.findTodoListById(Number(id), tenantId, userId)

  return res.json({
    success: true,
    data: todoList
  })
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, userId } = req

  const validated = await createTodoListSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const todoList = await TodoListService.createTodoList(tenantId, userId, validated)

  return res.status(201).json({
    success: true,
    data: todoList
  })
}

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, userId } = req
  const { id } = req.params

  const validated = await updateTodoListSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const todoList = await TodoListService.updateTodoList(Number(id), tenantId, userId, validated)

  return res.json({
    success: true,
    data: todoList
  })
}

export const toggle = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, userId } = req
  const { id } = req.params

  const todoList = await TodoListService.toggleTodoList(Number(id), tenantId, userId)

  return res.json({
    success: true,
    data: todoList
  })
}

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, userId } = req
  const { id } = req.params

  await TodoListService.deleteTodoList(Number(id), tenantId, userId)

  return res.json({
    success: true,
    data: { message: "TodoList deleted successfully" }
  })
}

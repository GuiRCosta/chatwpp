import { Request, Response } from "express"

import * as UserService from "../services/UserService"
import { createUserSchema, updateUserSchema } from "../validators/UserValidator"

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { searchParam, pageNumber, limit } = req.query

  const { users, count, hasMore } = await UserService.listUsers({
    tenantId,
    searchParam: String(searchParam || ""),
    pageNumber: String(pageNumber || "1"),
    limit: String(limit || "20")
  })

  return res.json({
    success: true,
    data: users,
    meta: {
      total: count,
      page: Number(pageNumber || 1),
      limit: Number(limit || 20),
      hasMore
    }
  })
}

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const user = await UserService.findUserById(Number(id), tenantId)

  return res.json({
    success: true,
    data: user
  })
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req

  const validated = await createUserSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const user = await UserService.createUser(tenantId, validated)

  return res.status(201).json({
    success: true,
    data: user
  })
}

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  const validated = await updateUserSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  })

  const user = await UserService.updateUser(Number(id), tenantId, validated)

  return res.json({
    success: true,
    data: user
  })
}

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req
  const { id } = req.params

  await UserService.deleteUser(Number(id), tenantId)

  return res.json({
    success: true,
    data: { message: "User deleted successfully" }
  })
}

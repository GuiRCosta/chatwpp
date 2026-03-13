import { Op } from "sequelize"

import Macro from "../models/Macro"
import User from "../models/User"
import Ticket from "../models/Ticket"
import { AppError } from "../helpers/AppError"
import { emitToTenant } from "../libs/socket"
import * as ActionExecutor from "./ActionExecutor"
import { logger } from "../helpers/logger"
import type { MacroAction, ExecutionResult } from "./ActionExecutor"

interface ListParams {
  tenantId: number
  userId: number
  searchParam?: string
}

export const listMacros = async ({
  tenantId,
  userId,
  searchParam = ""
}: ListParams): Promise<Macro[]> => {
  const where: Record<string, unknown> = {
    tenantId,
    isActive: true,
    [Op.or]: [{ visibility: "global" }, { createdById: userId }]
  }

  if (searchParam) {
    where.name = { [Op.iLike]: `%${searchParam}%` }
  }

  const macros = await Macro.findAll({
    where,
    include: [
      { model: User, as: "createdBy", attributes: ["id", "name"] }
    ],
    order: [["name", "ASC"]]
  })

  return macros
}

export const findMacroById = async (
  id: number,
  tenantId: number,
  userId: number
): Promise<Macro> => {
  const macro = await Macro.findOne({
    where: {
      id,
      tenantId,
      [Op.or]: [{ visibility: "global" }, { createdById: userId }]
    },
    include: [
      { model: User, as: "createdBy", attributes: ["id", "name"] }
    ]
  })

  if (!macro) {
    throw new AppError("Macro not found", 404)
  }

  return macro
}

export const createMacro = async (
  tenantId: number,
  userId: number,
  data: {
    name: string
    description?: string | null
    actions: MacroAction[]
    visibility: "personal" | "global"
  }
): Promise<Macro> => {
  const existing = await Macro.findOne({
    where: { name: { [Op.iLike]: data.name }, tenantId }
  })
  if (existing) {
    throw new AppError("A macro with this name already exists", 409)
  }

  const macro = await Macro.create({
    tenantId,
    name: data.name,
    description: data.description || null,
    actions: data.actions,
    visibility: data.visibility,
    createdById: userId
  })

  const created = await Macro.findByPk(macro.id, {
    include: [
      { model: User, as: "createdBy", attributes: ["id", "name"] }
    ]
  })

  emitToTenant(tenantId, "macro:created", created)
  return created!
}

export const updateMacro = async (
  id: number,
  tenantId: number,
  userId: number,
  userProfile: string,
  data: {
    name?: string
    description?: string | null
    actions?: MacroAction[]
    visibility?: string
    isActive?: boolean
  }
): Promise<Macro> => {
  const macro = await Macro.findOne({ where: { id, tenantId } })
  if (!macro) {
    throw new AppError("Macro not found", 404)
  }

  const isAdmin = ["admin", "superadmin"].includes(userProfile)
  if (macro.createdById !== userId && !isAdmin) {
    throw new AppError("You can only edit your own macros", 403)
  }

  if (data.name) {
    const existing = await Macro.findOne({
      where: {
        name: { [Op.iLike]: data.name },
        tenantId,
        id: { [Op.ne]: id }
      }
    })
    if (existing) {
      throw new AppError("A macro with this name already exists", 409)
    }
  }

  await macro.update(data)

  const updated = await Macro.findByPk(id, {
    include: [
      { model: User, as: "createdBy", attributes: ["id", "name"] }
    ]
  })

  emitToTenant(tenantId, "macro:updated", updated)
  return updated!
}

export const deleteMacro = async (
  id: number,
  tenantId: number,
  userId: number,
  userProfile: string
): Promise<void> => {
  const macro = await Macro.findOne({ where: { id, tenantId } })
  if (!macro) {
    throw new AppError("Macro not found", 404)
  }

  const isAdmin = ["admin", "superadmin"].includes(userProfile)
  if (macro.createdById !== userId && !isAdmin) {
    throw new AppError("You can only delete your own macros", 403)
  }

  await macro.destroy()
  emitToTenant(tenantId, "macro:deleted", { id })
}

export const executeMacro = async (
  macroId: number,
  ticketIds: number[],
  tenantId: number,
  userId: number
): Promise<{ ticketId: number; result: ExecutionResult }[]> => {
  const macro = await findMacroById(macroId, tenantId, userId)

  const tickets = await Ticket.findAll({
    where: { id: ticketIds, tenantId }
  })
  if (tickets.length !== ticketIds.length) {
    throw new AppError("Some tickets were not found", 404)
  }

  const executionResults: { ticketId: number; result: ExecutionResult }[] = []

  for (const ticketId of ticketIds) {
    const result = await ActionExecutor.executeActions(macro.actions, {
      ticketId,
      tenantId,
      userId
    })

    executionResults.push({ ticketId, result })

    logger.info(
      "MacroService: Macro '%s' executed on ticket %d: %d/%d succeeded",
      macro.name,
      ticketId,
      result.succeeded,
      result.totalActions
    )
  }

  return executionResults
}

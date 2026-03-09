import { Op } from "sequelize"

import WhatsApp from "../models/WhatsApp"
import UserWhatsApp from "../models/UserWhatsApp"
import User from "../models/User"
import Tenant from "../models/Tenant"
import { AppError } from "../helpers/AppError"
import { emitToTenant } from "../libs/socket"
import {
  exchangeCodeForToken,
  debugToken,
  getPhoneNumbers,
  subscribeApp
} from "../libs/waba/wabaClient"
import { logger } from "../helpers/logger"

interface ListParams {
  tenantId: number
}

interface ListWhatsAppsResult {
  whatsapps: WhatsApp[]
  meta: {
    connectionCount: number
    maxConnections: number
  }
}

const WHATSAPP_SAFE_EXCLUDE = ["wabaToken", "wabaWebhookSecret"]

export const listWhatsApps = async ({ tenantId }: ListParams): Promise<ListWhatsAppsResult> => {
  const [whatsapps, tenant] = await Promise.all([
    WhatsApp.findAll({
      where: { tenantId },
      attributes: { exclude: WHATSAPP_SAFE_EXCLUDE },
      include: [
        { model: UserWhatsApp, as: "userWhatsApps", include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }] }
      ],
      order: [["name", "ASC"]]
    }),
    Tenant.findByPk(tenantId, { attributes: ["id", "maxConnections"] })
  ])

  return {
    whatsapps,
    meta: {
      connectionCount: whatsapps.length,
      maxConnections: tenant?.maxConnections ?? 99
    }
  }
}

export const findWhatsAppById = async (id: number, tenantId: number): Promise<WhatsApp> => {
  const whatsapp = await WhatsApp.findOne({
    where: { id, tenantId },
    attributes: { exclude: WHATSAPP_SAFE_EXCLUDE },
    include: [
      { model: UserWhatsApp, as: "userWhatsApps", include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }] }
    ]
  })

  if (!whatsapp) {
    throw new AppError("WhatsApp connection not found", 404)
  }

  return whatsapp
}

export const getDefaultWhatsApp = async (tenantId: number): Promise<WhatsApp> => {
  const whatsapp = await WhatsApp.findOne({
    where: { tenantId, isDefault: true }
  })

  if (!whatsapp) {
    throw new AppError("No default WhatsApp connection found", 404)
  }

  return whatsapp
}

export const createWhatsApp = async (tenantId: number, data: {
  name: string
  type?: string
  wabaAccountId?: string
  wabaPhoneNumberId?: string
  wabaToken?: string
  number?: string
  greetingMessage?: string
  farewellMessage?: string
  isDefault?: boolean
  userIds?: number[]
}): Promise<WhatsApp> => {
  const tenant = await Tenant.findByPk(tenantId)

  if (tenant) {
    const connectionCount = await WhatsApp.count({ where: { tenantId } })
    if (connectionCount >= tenant.maxConnections) {
      throw new AppError("Connection limit reached for this tenant", 403)
    }
  }

  if (data.isDefault) {
    await WhatsApp.update(
      { isDefault: false },
      { where: { tenantId } }
    )
  }

  const whatsapp = await WhatsApp.create({
    tenantId,
    name: data.name,
    type: data.type || "waba",
    wabaAccountId: data.wabaAccountId || "",
    wabaPhoneNumberId: data.wabaPhoneNumberId || "",
    wabaToken: data.wabaToken || "",
    number: data.number || "",
    greetingMessage: data.greetingMessage || "",
    farewellMessage: data.farewellMessage || "",
    isDefault: data.isDefault || false
  })

  if (data.userIds && data.userIds.length > 0) {
    const entries = data.userIds.map(userId => ({
      userId,
      whatsappId: whatsapp.id
    }))
    await UserWhatsApp.bulkCreate(entries)
  }

  const created = await findWhatsAppById(whatsapp.id, tenantId)

  emitToTenant(tenantId, "whatsapp:created", created)

  return created
}

export const updateWhatsApp = async (id: number, tenantId: number, data: {
  name?: string
  wabaAccountId?: string
  wabaPhoneNumberId?: string
  wabaToken?: string
  wabaWebhookSecret?: string
  number?: string
  greetingMessage?: string
  farewellMessage?: string
  isDefault?: boolean
  status?: string
  userIds?: number[]
}): Promise<WhatsApp> => {
  const whatsapp = await WhatsApp.findOne({ where: { id, tenantId } })

  if (!whatsapp) {
    throw new AppError("WhatsApp connection not found", 404)
  }

  if (data.isDefault) {
    await WhatsApp.update(
      { isDefault: false },
      { where: { tenantId, id: { [Op.ne]: id } } }
    )
  }

  const { userIds, ...updateData } = data

  await whatsapp.update(updateData)

  if (userIds !== undefined) {
    await UserWhatsApp.destroy({ where: { whatsappId: id } })
    if (userIds.length > 0) {
      const entries = userIds.map(userId => ({
        userId,
        whatsappId: id
      }))
      await UserWhatsApp.bulkCreate(entries)
    }
  }

  const updated = await findWhatsAppById(id, tenantId)

  emitToTenant(tenantId, "whatsapp:updated", updated)

  return updated
}

export const onboardFromFBL = async (tenantId: number, data: {
  code: string
  wabaId: string
  phoneNumberId: string
  name: string
  userIds?: number[]
}): Promise<WhatsApp> => {
  const existing = await WhatsApp.findOne({
    where: { tenantId, wabaPhoneNumberId: data.phoneNumberId }
  })

  if (existing) {
    throw new AppError("This phone number is already connected", 409)
  }

  const tenant = await Tenant.findByPk(tenantId)
  const connectionCount = await WhatsApp.count({ where: { tenantId } })

  if (tenant && connectionCount >= tenant.maxConnections) {
    throw new AppError("Connection limit reached for this tenant", 403)
  }

  const tokenResult = await exchangeCodeForToken(data.code)
  logger.info("FBL token exchange successful for tenant %d", tenantId)

  const tokenInfo = await debugToken(tokenResult.accessToken)

  if (!tokenInfo.isValid) {
    throw new AppError("Invalid access token received from Facebook", 400)
  }

  const requiredScopes = ["whatsapp_business_management", "whatsapp_business_messaging"]
  const missingScopes = requiredScopes.filter(scope => !tokenInfo.scopes.includes(scope))

  if (missingScopes.length > 0) {
    throw new AppError(
      `Missing required permissions: ${missingScopes.join(", ")}. Please re-authorize.`,
      400
    )
  }

  const phoneNumbers = await getPhoneNumbers(data.wabaId, tokenResult.accessToken)
  const phoneInfo = phoneNumbers.find(p => p.id === data.phoneNumberId)
  const displayNumber = phoneInfo?.displayPhoneNumber || ""

  await subscribeApp(data.phoneNumberId, tokenResult.accessToken)

  const isFirst = connectionCount === 0

  const whatsapp = await WhatsApp.create({
    tenantId,
    name: data.name,
    type: "waba",
    status: "connected",
    wabaAccountId: data.wabaId,
    wabaPhoneNumberId: data.phoneNumberId,
    wabaToken: tokenResult.accessToken,
    number: displayNumber,
    isDefault: isFirst,
    greetingMessage: "",
    farewellMessage: ""
  })

  if (data.userIds && data.userIds.length > 0) {
    const entries = data.userIds.map(userId => ({
      userId,
      whatsappId: whatsapp.id
    }))
    await UserWhatsApp.bulkCreate(entries)
  }

  const created = await findWhatsAppById(whatsapp.id, tenantId)

  const { wabaToken: _wabaToken, wabaWebhookSecret: _wabaWebhookSecret, ...safeWhatsapp } = created.toJSON()
  emitToTenant(tenantId, "whatsapp:created", safeWhatsapp)

  logger.info(
    "FBL onboard complete: tenant=%d, whatsappId=%d, phone=%s",
    tenantId, whatsapp.id, displayNumber
  )

  return created
}

export const deleteWhatsApp = async (id: number, tenantId: number): Promise<void> => {
  const whatsapp = await WhatsApp.findOne({ where: { id, tenantId } })

  if (!whatsapp) {
    throw new AppError("WhatsApp connection not found", 404)
  }

  if (whatsapp.isDefault) {
    throw new AppError("Cannot delete the default WhatsApp connection. Set another as default first.", 400)
  }

  await UserWhatsApp.destroy({ where: { whatsappId: id } })
  await whatsapp.destroy()

  emitToTenant(tenantId, "whatsapp:deleted", { id })
}

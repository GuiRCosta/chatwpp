import { Op } from "sequelize"

import WhatsApp from "../models/WhatsApp"
import { AppError } from "../helpers/AppError"
import { emitToTenant } from "../libs/socket"
import {
  exchangeCodeForToken,
  debugToken,
  getPhoneNumbers,
  subscribeApp
} from "../libs/waba/wabaClient"
import logger from "../helpers/logger"

interface ListParams {
  tenantId: number
}

export const listWhatsApps = async ({ tenantId }: ListParams): Promise<WhatsApp[]> => {
  const whatsapps = await WhatsApp.findAll({
    where: { tenantId },
    order: [["name", "ASC"]]
  })

  return whatsapps
}

export const findWhatsAppById = async (id: number, tenantId: number): Promise<WhatsApp> => {
  const whatsapp = await WhatsApp.findOne({
    where: { id, tenantId }
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
}): Promise<WhatsApp> => {
  const tenant = await (await import("../models/Tenant")).default.findByPk(tenantId)

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

  emitToTenant(tenantId, "whatsapp:created", whatsapp)

  return whatsapp
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

  await whatsapp.update(data)

  emitToTenant(tenantId, "whatsapp:updated", whatsapp)

  return whatsapp
}

export const onboardFromFBL = async (tenantId: number, data: {
  code: string
  wabaId: string
  phoneNumberId: string
  name: string
}): Promise<WhatsApp> => {
  const existing = await WhatsApp.findOne({
    where: { tenantId, wabaPhoneNumberId: data.phoneNumberId }
  })

  if (existing) {
    throw new AppError("This phone number is already connected", 409)
  }

  const tenant = await (await import("../models/Tenant")).default.findByPk(tenantId)
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

  const { wabaToken: _wabaToken, wabaWebhookSecret: _wabaWebhookSecret, ...safeWhatsapp } = whatsapp.toJSON()
  emitToTenant(tenantId, "whatsapp:created", safeWhatsapp)

  logger.info(
    "FBL onboard complete: tenant=%d, whatsappId=%d, phone=%s",
    tenantId, whatsapp.id, displayNumber
  )

  return whatsapp
}

export const deleteWhatsApp = async (id: number, tenantId: number): Promise<void> => {
  const whatsapp = await WhatsApp.findOne({ where: { id, tenantId } })

  if (!whatsapp) {
    throw new AppError("WhatsApp connection not found", 404)
  }

  if (whatsapp.isDefault) {
    throw new AppError("Cannot delete the default WhatsApp connection. Set another as default first.", 400)
  }

  await whatsapp.destroy()

  emitToTenant(tenantId, "whatsapp:deleted", { id })
}

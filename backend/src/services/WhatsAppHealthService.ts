import axios from "axios"
import { Op } from "sequelize"

import WhatsApp from "../models/WhatsApp"
import User from "../models/User"
import { createNotification } from "./NotificationService"
import { logger } from "../helpers/logger"

const GRAPH_API_URL = "https://graph.facebook.com/v25.0"
const HEALTH_CHECK_TIMEOUT = 10000

export async function checkWhatsAppConnections(): Promise<void> {
  const connectedWhatsApps = await WhatsApp.findAll({
    where: { status: "connected" }
  })

  if (connectedWhatsApps.length === 0) {
    logger.debug("WhatsAppHealthService: No connected WhatsApp instances to check")
    return
  }

  for (const whatsapp of connectedWhatsApps) {
    await checkSingleConnection(whatsapp)
  }
}

async function checkSingleConnection(whatsapp: WhatsApp): Promise<void> {
  if (!whatsapp.wabaPhoneNumberId || !whatsapp.wabaToken) {
    logger.warn(
      "WhatsAppHealthService: WhatsApp %d missing credentials, skipping",
      whatsapp.id
    )
    return
  }

  try {
    await axios.get(
      `${GRAPH_API_URL}/${whatsapp.wabaPhoneNumberId}`,
      {
        params: {
          fields: "display_phone_number",
          access_token: whatsapp.wabaToken
        },
        timeout: HEALTH_CHECK_TIMEOUT
      }
    )

    logger.debug("WhatsAppHealthService: WhatsApp %d health check passed", whatsapp.id)
  } catch (error) {
    await handleHealthCheckFailure(whatsapp, error)
  }
}

async function handleHealthCheckFailure(
  whatsapp: WhatsApp,
  error: unknown
): Promise<void> {
  const axiosError = error as { response?: { status?: number }; code?: string }
  const status = axiosError.response?.status
  const code = axiosError.code

  if (status === 401 || status === 403) {
    logger.error(
      "WhatsAppHealthService: WhatsApp %d auth failed (HTTP %d), marking disconnected",
      whatsapp.id,
      status
    )

    await whatsapp.update({ status: "disconnected" })
    await notifyAdmins(
      whatsapp.tenantId,
      "Conexao WhatsApp Perdida",
      `A conexao WhatsApp "${whatsapp.name}" (${whatsapp.number}) foi desconectada por credenciais invalidas. Por favor, reconecte.`
    )
    return
  }

  if (code === "ECONNABORTED" || code === "ETIMEDOUT" || code === "ENOTFOUND") {
    logger.warn(
      "WhatsAppHealthService: WhatsApp %d health check timeout/network error, keeping status",
      whatsapp.id
    )
    return
  }

  logger.warn(
    "WhatsAppHealthService: WhatsApp %d health check failed unexpectedly: %o",
    whatsapp.id,
    error
  )
}

async function notifyAdmins(
  tenantId: number,
  title: string,
  message: string
): Promise<void> {
  const admins = await User.findAll({
    where: {
      tenantId,
      profile: { [Op.in]: ["admin", "superadmin"] }
    },
    attributes: ["id"]
  })

  const notificationPromises = admins.map(admin =>
    createNotification(tenantId, {
      userId: admin.id,
      title,
      message
    })
  )

  await Promise.allSettled(notificationPromises)

  logger.info(
    "WhatsAppHealthService: Notified %d admin(s) for tenant %d",
    admins.length,
    tenantId
  )
}

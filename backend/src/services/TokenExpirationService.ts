import { Op } from "sequelize"

import WhatsApp from "../models/WhatsApp"
import User from "../models/User"
import { createNotification } from "./NotificationService"
import { logger } from "../helpers/logger"

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export async function checkTokenExpirations(): Promise<void> {
  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + SEVEN_DAYS_MS)

  const expiringWhatsApps = await WhatsApp.findAll({
    where: {
      tokenExpiresAt: {
        [Op.ne]: null,
        [Op.lte]: sevenDaysFromNow
      },
      status: "connected"
    }
  })

  if (expiringWhatsApps.length === 0) {
    logger.debug("TokenExpirationService: No tokens expiring within 7 days")
    return
  }

  for (const whatsapp of expiringWhatsApps) {
    await handleExpiringToken(whatsapp, now)
  }

  logger.info(
    "TokenExpirationService: Checked %d expiring token(s)",
    expiringWhatsApps.length
  )
}

async function handleExpiringToken(whatsapp: WhatsApp, now: Date): Promise<void> {
  if (!whatsapp.tokenExpiresAt) return

  const isExpired = whatsapp.tokenExpiresAt <= now
  const daysUntilExpiry = Math.ceil(
    (whatsapp.tokenExpiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
  )

  if (isExpired) {
    logger.warn(
      "TokenExpirationService: WhatsApp %d token expired, marking disconnected",
      whatsapp.id
    )

    await whatsapp.update({ status: "disconnected" })

    await notifyAdmins(
      whatsapp.tenantId,
      "Token WhatsApp Expirado - Urgente",
      `O token da conexao "${whatsapp.name}" (${whatsapp.number}) EXPIROU. A conexao foi desconectada. Reconecte imediatamente.`
    )
  } else {
    logger.warn(
      "TokenExpirationService: WhatsApp %d token expires in %d day(s)",
      whatsapp.id,
      daysUntilExpiry
    )

    await notifyAdmins(
      whatsapp.tenantId,
      "Token WhatsApp Expirando",
      `O token da conexao "${whatsapp.name}" (${whatsapp.number}) expira em ${daysUntilExpiry} dia(s). Reconecte para evitar interrupcao.`
    )
  }
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
}

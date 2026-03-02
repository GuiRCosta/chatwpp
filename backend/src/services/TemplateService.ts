import MessageTemplate from "../models/MessageTemplate"
import WhatsApp from "../models/WhatsApp"
import { getMessageTemplates } from "../libs/waba/wabaClient"
import { logger } from "../helpers/logger"

interface SyncResult {
  whatsappId: number
  whatsappName: string
  synced: number
  errors: string[]
}

export const syncTemplates = async (
  tenantId: number,
  whatsappId?: number
): Promise<SyncResult[]> => {
  const where: Record<string, unknown> = { tenantId }

  if (whatsappId) {
    where.id = whatsappId
  }

  const connections = await WhatsApp.findAll({ where })
  const results: SyncResult[] = []

  for (const conn of connections) {
    const result: SyncResult = {
      whatsappId: conn.id,
      whatsappName: conn.name,
      synced: 0,
      errors: []
    }

    if (!conn.wabaAccountId || !conn.wabaToken) {
      result.errors.push("Missing WABA account ID or token")
      results.push(result)
      continue
    }

    try {
      const templates = await getMessageTemplates(conn.wabaAccountId, conn.wabaToken)

      for (const tpl of templates) {
        try {
          const [record, created] = await MessageTemplate.findOrCreate({
            where: {
              tenantId,
              whatsappId: conn.id,
              name: tpl.name,
              language: tpl.language
            },
            defaults: {
              tenantId,
              whatsappId: conn.id,
              name: tpl.name,
              language: tpl.language,
              status: tpl.status,
              category: tpl.category,
              components: tpl.components
            }
          })

          if (!created) {
            await record.update({
              status: tpl.status,
              category: tpl.category,
              components: tpl.components
            })
          }

          result.synced++
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error)
          logger.error("Failed to upsert template %s/%s: %s", tpl.name, tpl.language, msg)
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      result.errors.push(msg)
      logger.error("Failed to fetch templates for WhatsApp %d: %s", conn.id, msg)
    }

    results.push(result)
  }

  return results
}

export const listTemplates = async (
  tenantId: number,
  whatsappId?: number
): Promise<MessageTemplate[]> => {
  const where: Record<string, unknown> = {
    tenantId,
    status: "APPROVED"
  }

  if (whatsappId) {
    where.whatsappId = whatsappId
  }

  const templates = await MessageTemplate.findAll({
    where,
    include: [
      {
        model: WhatsApp,
        as: "whatsapp",
        attributes: ["id", "name"]
      }
    ],
    order: [["name", "ASC"], ["language", "ASC"]]
  })

  return templates
}

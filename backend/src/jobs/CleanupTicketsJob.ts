import { Job } from "bull"
import { Op } from "sequelize"

import Ticket from "../models/Ticket"
import TicketLog from "../models/TicketLog"
import Setting from "../models/Setting"
import Tenant from "../models/Tenant"
import { emitToTenant } from "../libs/socket"
import logger from "../helpers/logger"

export const QUEUE_NAME = "cleanup-tickets"

export interface CleanupData {
  tenantId?: number
}

const DEFAULT_HOURS_INACTIVE = 24

export async function process(job: Job<CleanupData>): Promise<void> {
  const { tenantId } = job.data

  const tenants = tenantId
    ? [await Tenant.findByPk(tenantId)]
    : await Tenant.findAll({ where: { status: "active" } })

  let totalClosed = 0

  for (const tenant of tenants) {
    if (!tenant) continue

    const hoursInactive = await getInactiveHours(tenant.id)
    const cutoffDate = new Date(Date.now() - hoursInactive * 60 * 60 * 1000)

    const staleTickets = await Ticket.findAll({
      where: {
        tenantId: tenant.id,
        status: { [Op.in]: ["open", "pending"] },
        lastMessageAt: { [Op.lt]: cutoffDate }
      }
    })

    for (const ticket of staleTickets) {
      await ticket.update({ status: "closed" })

      await TicketLog.create({
        ticketId: ticket.id,
        type: "status_changed",
        payload: {
          from: ticket.status,
          to: "closed",
          reason: "inactivity",
          hoursInactive
        }
      })

      emitToTenant(tenant.id, "ticket:updated", ticket)
      totalClosed++
    }
  }

  if (totalClosed > 0) {
    logger.info("CleanupTicketsJob: Closed %d inactive tickets", totalClosed)
  }
}

async function getInactiveHours(tenantId: number): Promise<number> {
  const setting = await Setting.findOne({
    where: { tenantId, key: "timeCreateNewTicket" }
  })

  if (setting?.value) {
    const minutes = Number(setting.value)
    if (!isNaN(minutes) && minutes > 0) {
      return minutes / 60
    }
  }

  return DEFAULT_HOURS_INACTIVE
}

import { QueryInterface } from "sequelize"
import { encrypt, decrypt, isEncrypted } from "../../helpers/encryption"

interface WhatsAppRow {
  id: number
  wabaToken: string
}

module.exports = {
  async up(queryInterface: QueryInterface) {
    const rows = await queryInterface.sequelize.query<WhatsAppRow>(
      `SELECT id, "wabaToken" FROM "WhatsApps" WHERE "wabaToken" IS NOT NULL AND "wabaToken" != ''`,
      { type: "SELECT" as never }
    )

    for (const row of rows) {
      if (!isEncrypted(row.wabaToken)) {
        const encrypted = encrypt(row.wabaToken)
        await queryInterface.sequelize.query(
          `UPDATE "WhatsApps" SET "wabaToken" = $1 WHERE id = $2`,
          { bind: [encrypted, row.id] }
        )
      }
    }
  },

  async down(queryInterface: QueryInterface) {
    const rows = await queryInterface.sequelize.query<WhatsAppRow>(
      `SELECT id, "wabaToken" FROM "WhatsApps" WHERE "wabaToken" IS NOT NULL AND "wabaToken" != ''`,
      { type: "SELECT" as never }
    )

    for (const row of rows) {
      if (isEncrypted(row.wabaToken)) {
        const decrypted = decrypt(row.wabaToken)
        await queryInterface.sequelize.query(
          `UPDATE "WhatsApps" SET "wabaToken" = $1 WHERE id = $2`,
          { bind: [decrypted, row.id] }
        )
      }
    }
  }
}

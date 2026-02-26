import { QueryInterface } from "sequelize"

const defaultSettings = [
  { key: "userCreation", value: "disabled" },
  { key: "acceptCallGroup", value: "disabled" },
  { key: "userRandom", value: "enabled" },
  { key: "sendGreetingMessage", value: "enabled" },
  { key: "sendFarewellMessage", value: "enabled" },
  { key: "timeCreateNewTicket", value: "120" },
  { key: "sendSignMessage", value: "enabled" },
  { key: "chatBotType", value: "text" },
  { key: "scheduleType", value: "disabled" },
  { key: "allowGroup", value: "disabled" }
]

module.exports = {
  async up(queryInterface: QueryInterface): Promise<void> {
    const now = new Date()

    const settings = defaultSettings.map((setting, index) => ({
      id: index + 1,
      tenantId: 1,
      key: setting.key,
      value: setting.value,
      createdAt: now,
      updatedAt: now
    }))

    await queryInterface.bulkInsert("Settings", settings)

    await queryInterface.sequelize.query(
      `SELECT setval('"Settings_id_seq"', (SELECT MAX(id) FROM "Settings"));`
    )
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.bulkDelete("Settings", { tenantId: 1 })
  }
}

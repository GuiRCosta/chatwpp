import { QueryInterface } from "sequelize"

module.exports = {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.bulkInsert("Tenants", [
      {
        id: 1,
        name: "ZFlow Admin",
        status: "active",
        maxUsers: 99,
        maxConnections: 99,
        businessHours: JSON.stringify({
          monday: { start: "08:00", end: "18:00", enabled: true },
          tuesday: { start: "08:00", end: "18:00", enabled: true },
          wednesday: { start: "08:00", end: "18:00", enabled: true },
          thursday: { start: "08:00", end: "18:00", enabled: true },
          friday: { start: "08:00", end: "18:00", enabled: true },
          saturday: { start: "08:00", end: "12:00", enabled: false },
          sunday: { start: "00:00", end: "00:00", enabled: false }
        }),
        settings: JSON.stringify({}),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ])

    await queryInterface.sequelize.query(
      `SELECT setval('"Tenants_id_seq"', (SELECT MAX(id) FROM "Tenants"));`
    )
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.bulkDelete("Tenants", { id: 1 })
  }
}

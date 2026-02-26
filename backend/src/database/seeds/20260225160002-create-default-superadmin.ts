import { QueryInterface } from "sequelize"
import { hashSync } from "bcryptjs"

module.exports = {
  async up(queryInterface: QueryInterface): Promise<void> {
    const passwordHash = hashSync("admin123", 10)

    await queryInterface.bulkInsert("Users", [
      {
        id: 1,
        tenantId: 1,
        name: "Super Admin",
        email: "admin@zflow.com",
        passwordHash,
        profile: "superadmin",
        isOnline: false,
        lastLogin: null,
        configs: JSON.stringify({}),
        tokenVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ])

    await queryInterface.sequelize.query(
      `SELECT setval('"Users_id_seq"', (SELECT MAX(id) FROM "Users"));`
    )
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.bulkDelete("Users", { id: 1 })
  }
}

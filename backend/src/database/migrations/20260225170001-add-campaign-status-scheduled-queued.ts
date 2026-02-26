import { QueryInterface } from "sequelize"

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Campaigns_status"
      ADD VALUE IF NOT EXISTS 'scheduled' AFTER 'pending'
    `)
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Campaigns_status"
      ADD VALUE IF NOT EXISTS 'queued' AFTER 'scheduled'
    `)
  },

  down: async (): Promise<void> => {
    // PostgreSQL does not support removing values from ENUMs
    // To revert, a full ENUM recreation would be needed
  }
}

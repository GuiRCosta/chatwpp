import { QueryInterface } from "sequelize"

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Campaigns_status"
      ADD VALUE IF NOT EXISTS 'running' AFTER 'queued'
    `)
  },

  down: async (): Promise<void> => {
    // PostgreSQL does not support removing values from ENUMs
  }
}

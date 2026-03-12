import { QueryInterface, DataTypes } from "sequelize"

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn("WhatsApps", "tokenExpiresAt", {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    })
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn("WhatsApps", "tokenExpiresAt")
  }
}

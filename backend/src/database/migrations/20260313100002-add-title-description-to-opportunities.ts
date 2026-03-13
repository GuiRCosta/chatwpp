import { QueryInterface, DataTypes } from "sequelize"

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn("Opportunities", "title", {
      type: DataTypes.STRING,
      allowNull: true
    })

    await queryInterface.addColumn("Opportunities", "description", {
      type: DataTypes.TEXT,
      allowNull: true
    })
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn("Opportunities", "description")
    await queryInterface.removeColumn("Opportunities", "title")
  }
}

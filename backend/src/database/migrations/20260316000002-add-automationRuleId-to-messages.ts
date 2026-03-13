import { QueryInterface, DataTypes } from "sequelize"

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Messages", "automationRuleId", {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null
    })
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Messages", "automationRuleId")
  }
}

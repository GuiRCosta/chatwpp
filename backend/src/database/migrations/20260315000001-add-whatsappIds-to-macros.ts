import { QueryInterface, DataTypes } from "sequelize"

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Macros", "whatsappIds", {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
      defaultValue: null
    })
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Macros", "whatsappIds")
  }
}

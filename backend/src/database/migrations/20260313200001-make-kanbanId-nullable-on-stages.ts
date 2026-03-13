import { QueryInterface, DataTypes } from "sequelize"

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.changeColumn("Stages", "kanbanId", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "Kanbans", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    })
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.changeColumn("Stages", "kanbanId", {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "Kanbans", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    })
  }
}

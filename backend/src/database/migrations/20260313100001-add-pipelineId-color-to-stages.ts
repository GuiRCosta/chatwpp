import { QueryInterface, DataTypes } from "sequelize"

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn("Stages", "pipelineId", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Pipelines",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    })

    await queryInterface.addColumn("Stages", "color", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "#6B7280"
    })
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn("Stages", "color")
    await queryInterface.removeColumn("Stages", "pipelineId")
  }
}

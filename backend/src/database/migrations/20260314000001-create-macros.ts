import { QueryInterface, DataTypes } from "sequelize"

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable("Macros", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Tenants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      actions: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: []
      },
      visibility: {
        type: DataTypes.ENUM("personal", "global"),
        allowNull: false,
        defaultValue: "personal"
      },
      createdById: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    })

    await queryInterface.addIndex("Macros", ["tenantId", "visibility"])
    await queryInterface.addIndex("Macros", ["createdById"])
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable("Macros")
  }
}

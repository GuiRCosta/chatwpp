import { QueryInterface, DataTypes } from "sequelize"

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("AutomationRules", {
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
      eventName: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      conditions: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: []
      },
      actions: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: []
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    })

    await queryInterface.addIndex(
      "AutomationRules",
      ["tenantId", "eventName", "isActive"],
      { name: "automation_rules_tenant_event_active" }
    )
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("AutomationRules")
  }
}

import { QueryInterface, DataTypes } from "sequelize"

module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable("TenantWebhooks", {
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
      url: {
        type: DataTypes.STRING(500),
        allowNull: false
      },
      events: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: []
      },
      secret: {
        type: DataTypes.STRING(255),
        allowNull: true
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

    await queryInterface.addIndex("TenantWebhooks", ["tenantId"], {
      name: "tenant_webhooks_tenant_id_idx"
    })
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable("TenantWebhooks")
  }
}

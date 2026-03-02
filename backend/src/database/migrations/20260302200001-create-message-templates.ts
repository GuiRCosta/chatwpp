import { QueryInterface, DataTypes } from "sequelize"

module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable("MessageTemplates", {
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
      whatsappId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "WhatsApps", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      language: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: "pt_BR"
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "APPROVED"
      },
      category: {
        type: DataTypes.STRING(30),
        allowNull: true
      },
      components: {
        type: DataTypes.JSONB,
        allowNull: true
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

    await queryInterface.addIndex("MessageTemplates", ["tenantId", "whatsappId", "name", "language"], {
      unique: true,
      name: "message_templates_tenant_whatsapp_name_lang_unique"
    })

    await queryInterface.addColumn("Campaigns", "templateName", {
      type: DataTypes.STRING,
      allowNull: true
    })

    await queryInterface.addColumn("Campaigns", "templateLanguage", {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: "pt_BR"
    })

    await queryInterface.addColumn("Campaigns", "templateComponents", {
      type: DataTypes.JSONB,
      allowNull: true
    })
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn("Campaigns", "templateComponents")
    await queryInterface.removeColumn("Campaigns", "templateLanguage")
    await queryInterface.removeColumn("Campaigns", "templateName")
    await queryInterface.dropTable("MessageTemplates")
  }
}

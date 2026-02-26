import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable("WhatsApps", {
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
        type: DataTypes.STRING,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM("waba"),
        defaultValue: "waba"
      },
      status: {
        type: DataTypes.ENUM("connected", "disconnected", "opening"),
        defaultValue: "disconnected"
      },
      wabaAccountId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      wabaPhoneNumberId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      wabaToken: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      wabaWebhookSecret: {
        type: DataTypes.STRING,
        allowNull: true
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      number: {
        type: DataTypes.STRING,
        allowNull: true
      },
      greetingMessage: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      farewellMessage: {
        type: DataTypes.TEXT,
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
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable("WhatsApps");
  }
};

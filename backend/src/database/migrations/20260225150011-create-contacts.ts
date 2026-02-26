import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable("Contacts", {
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
      number: {
        type: DataTypes.STRING,
        allowNull: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true
      },
      profilePicUrl: {
        type: DataTypes.STRING,
        allowNull: true
      },
      telegramId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      instagramId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      facebookId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      isGroup: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      customFields: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      walletId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      lgpdAcceptedAt: {
        type: DataTypes.DATE,
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

    await queryInterface.addIndex("Contacts", ["tenantId", "number"]);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable("Contacts");
  }
};

import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable("Users", {
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
      email: {
        type: DataTypes.STRING,
        allowNull: false
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false
      },
      profile: {
        type: DataTypes.ENUM("superadmin", "admin", "super", "user"),
        defaultValue: "user"
      },
      isOnline: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true
      },
      configs: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      tokenVersion: {
        type: DataTypes.INTEGER,
        defaultValue: 0
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

    await queryInterface.addIndex("Users", ["tenantId", "email"], {
      unique: true
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable("Users");
  }
};

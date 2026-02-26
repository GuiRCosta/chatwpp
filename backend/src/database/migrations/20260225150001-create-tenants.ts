import { QueryInterface, DataTypes } from "sequelize"

module.exports = {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable("Tenants", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM("active", "inactive", "trial"),
        allowNull: false,
        defaultValue: "active"
      },
      maxUsers: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 99
      },
      maxConnections: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 99
      },
      businessHours: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      settings: {
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
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable("Tenants")
  }
}

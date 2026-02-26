import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable("Opportunities", {
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
      contactId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Contacts", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      pipelineId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Pipelines", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      stageId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Stages", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM("open", "won", "lost"),
        defaultValue: "open"
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
    await queryInterface.dropTable("Opportunities");
  }
};

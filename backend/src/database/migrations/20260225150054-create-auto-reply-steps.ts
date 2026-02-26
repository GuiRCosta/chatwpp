import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable("AutoReplySteps", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      autoReplyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "AutoReplies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      stepOrder: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      mediaUrl: {
        type: DataTypes.STRING,
        allowNull: true
      },
      action: {
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
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable("AutoReplySteps");
  }
};

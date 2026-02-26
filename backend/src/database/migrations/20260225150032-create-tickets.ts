import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable("Tickets", {
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
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      queueId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Queues", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      whatsappId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "WhatsApps", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      status: {
        type: DataTypes.ENUM("open", "pending", "closed"),
        defaultValue: "pending"
      },
      channel: {
        type: DataTypes.STRING,
        allowNull: true
      },
      lastMessage: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      lastMessageAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      isGroup: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      unreadMessages: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      chatFlowId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "ChatFlows", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      protocol: {
        type: DataTypes.STRING,
        allowNull: true
      },
      isFarewellMessage: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
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

    await queryInterface.addIndex("Tickets", ["tenantId", "status"]);
    await queryInterface.addIndex("Tickets", ["tenantId", "contactId"]);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable("Tickets");
  }
};

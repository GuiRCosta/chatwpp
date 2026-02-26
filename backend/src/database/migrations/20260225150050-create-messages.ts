import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable("Messages", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      ticketId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Tickets", key: "id" },
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
      body: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      mediaUrl: {
        type: DataTypes.STRING,
        allowNull: true
      },
      mediaType: {
        type: DataTypes.STRING,
        allowNull: true
      },
      fromMe: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      quotedMsgId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      remoteJid: {
        type: DataTypes.STRING,
        allowNull: true
      },
      dataJson: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      timestamp: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      status: {
        type: DataTypes.STRING,
        allowNull: true
      },
      scheduleDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      sendType: {
        type: DataTypes.STRING,
        allowNull: true
      },
      ack: {
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

    await queryInterface.addIndex("Messages", ["ticketId", "createdAt"]);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable("Messages");
  }
};

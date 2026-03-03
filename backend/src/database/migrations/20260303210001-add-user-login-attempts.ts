import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.addColumn("Users", "loginAttempts", {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    await queryInterface.addColumn("Users", "lockedUntil", {
      type: DataTypes.DATE,
      allowNull: true
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn("Users", "lockedUntil");
    await queryInterface.removeColumn("Users", "loginAttempts");
  }
};

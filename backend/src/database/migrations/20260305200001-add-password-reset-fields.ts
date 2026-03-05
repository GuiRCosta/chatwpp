import { QueryInterface, DataTypes } from "sequelize"

module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.addColumn("Users", "passwordResetToken", {
      type: DataTypes.STRING,
      allowNull: true
    })

    await queryInterface.addColumn("Users", "passwordResetExpires", {
      type: DataTypes.DATE,
      allowNull: true
    })
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.removeColumn("Users", "passwordResetExpires")
    await queryInterface.removeColumn("Users", "passwordResetToken")
  }
}

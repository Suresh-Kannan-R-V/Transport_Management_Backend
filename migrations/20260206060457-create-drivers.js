"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("drivers", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id"
        },
        onDelete: "CASCADE"
      },
      license_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      license_expiry: {
        type: Sequelize.DATE,
        allowNull: false
      },
      experience_years: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "available"
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("drivers");
  }
};

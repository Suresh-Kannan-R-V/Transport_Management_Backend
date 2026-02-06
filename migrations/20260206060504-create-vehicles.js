"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("vehicles", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      vehicle_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      vehicle_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "active"
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("vehicles");
  }
};

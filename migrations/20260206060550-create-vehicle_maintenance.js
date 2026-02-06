"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("vehicle_maintenance", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      vehicle_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "vehicles", key: "id" }
      },
      maintenance_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      description: Sequelize.TEXT,
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "pending"
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("vehicle_maintenance");
  }
};

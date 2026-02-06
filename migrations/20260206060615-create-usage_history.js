"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("usage_history", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      vehicle_id: {
        type: Sequelize.INTEGER,
        references: { model: "vehicles", key: "id" }
      },
      driver_id: {
        type: Sequelize.INTEGER,
        references: { model: "drivers", key: "id" }
      },
      schedule_id: {
        type: Sequelize.INTEGER,
        references: { model: "schedules", key: "id" }
      },
      usage_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      distance_km: Sequelize.INTEGER,
      remarks: Sequelize.TEXT
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("usage_history");
  }
};

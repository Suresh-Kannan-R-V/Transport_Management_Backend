"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("schedules", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      route_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "routes", key: "id" }
      },
      vehicle_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "vehicles", key: "id" }
      },
      driver_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "drivers", key: "id" }
      },
      schedule_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "scheduled"
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("schedules");
  }
};

"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("schedules", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      route_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "routes", key: "id" },
        onDelete: "CASCADE",
      },

      vehicle_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "vehicles", key: "id" },
      },

      driver_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "drivers", key: "id" },
      },

      allocated_passenger_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      start_datetime: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      end_datetime: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      status: {
        type: Sequelize.STRING,
        defaultValue: "vehicle_assigned",
      },

      approved_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "users", key: "id" },
      },

      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("schedules");
  },
};

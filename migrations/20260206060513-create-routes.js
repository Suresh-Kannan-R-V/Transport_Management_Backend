"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("routes", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      route_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },

      travel_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      start_datetime: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      end_datetime: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      approx_distance_km: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },

      approx_duration_minutes: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      passenger_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      luggage_details: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      status: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1, // 1 = PENDING
      },

      faculty_remark: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      admin_remark: {
        type: Sequelize.TEXT,
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
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("routes");
  },
};

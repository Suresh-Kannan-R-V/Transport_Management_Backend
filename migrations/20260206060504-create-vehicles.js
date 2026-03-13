"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("vehicles", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      vehicle_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      vehicle_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "active",
      },

      current_kilometer: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      total_kilometer_runs: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      insurance_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      pollution_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      rc_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      fc_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      next_service_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
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
    await queryInterface.dropTable("vehicles");
  },
};
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("drivers", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      license_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      license_expiry: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      experience_years: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      blood_group: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      total_kilometer_drived: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },

      total_routes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      salary: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },

      status: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      }, // 1 = AVAILABLE
      // 2 = ASSIGNED
      // 3 = ON_TRIP
      // 4 = ON_LEAVE

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
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
    await queryInterface.dropTable("drivers");
  },
};

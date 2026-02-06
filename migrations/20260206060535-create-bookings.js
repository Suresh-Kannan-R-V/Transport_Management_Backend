"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("bookings", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" }
      },
      schedule_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "schedules", key: "id" }
      },
      seat_number: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      booking_status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "active"
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("bookings");
  }
};

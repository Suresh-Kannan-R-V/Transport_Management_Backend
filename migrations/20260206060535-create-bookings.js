"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("bookings", {
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

      schedule_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "schedules", key: "id" },
      },

      guest_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      country_code:{
        type: Sequelize.STRING,
        allowNull: true,
      },
      guest_phone: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      seat_number: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      is_primary: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      booking_status: {
        type: Sequelize.STRING,
        defaultValue: "active",
      },

      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("bookings");
  },
};

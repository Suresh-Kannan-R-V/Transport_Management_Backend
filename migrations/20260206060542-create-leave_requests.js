"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("leave_requests", {
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
      leave_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      reason: Sequelize.TEXT,
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "pending"
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("leave_requests");
  }
};

"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("route_stops", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      route_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "routes",
          key: "id"
        },
        onDelete: "CASCADE"
      },
      stop_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      stop_order: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      pickup_time: {
        type: Sequelize.TIME,
        allowNull: false
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("route_stops");
  }
};

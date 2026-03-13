"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("route_otps", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      route_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "routes",
          key: "id",
        },
        onDelete: "CASCADE",
      },

      otp_code: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },

      otp_type: {
        type: Sequelize.ENUM("START", "END"),
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

      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      used: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("route_otps");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_route_otps_otp_type";'
    );
  },
};
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("app_version_setups", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      platform: {
        type: Sequelize.ENUM("ANDROID", "IOS"),
        allowNull: false,
      },

      current_version: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      minimum_supported_version: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      force_update: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      maintenance_mode: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },

      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("app_version_setups");
  },
};

"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      role_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "roles",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      name: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      user_name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      password: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      isLogin: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      token: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      // ✅ NEW COLUMNS INCLUDED

      faculty_id: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },

      destination: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },

      department: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },

      push_notification_status: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("users");
  },
};

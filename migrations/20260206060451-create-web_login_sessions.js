"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("web_login_sessions", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      status: {
        type: Sequelize.ENUM("PENDING", "APPROVED", "EXPIRED"),
        allowNull: false,
        defaultValue: "PENDING",
      },
      web_access_expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      web_access_hour: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
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
    await queryInterface.dropTable("web_login_sessions");
    // await queryInterface.sequelize.query(
    //   'DROP TYPE IF EXISTS "enum_web_login_sessions_status";',
    // );
  },
};

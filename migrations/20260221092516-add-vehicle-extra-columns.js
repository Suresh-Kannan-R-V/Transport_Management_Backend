"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("vehicles", "current_kilometer", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn("vehicles", "insurance_date", {
      type: Sequelize.DATEONLY,
      allowNull: false,
    });

    await queryInterface.addColumn("vehicles", "pollution_date", {
      type: Sequelize.DATEONLY,
      allowNull: false,
    });

    await queryInterface.addColumn("vehicles", "rc_date", {
      type: Sequelize.DATEONLY,
      allowNull: false,
    });

    await queryInterface.addColumn("vehicles", "fc_date", {
      type: Sequelize.DATEONLY,
      allowNull: false,
    });

    await queryInterface.addColumn("vehicles", "next_service_date", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("vehicles", "current_kilometer");
    await queryInterface.removeColumn("vehicles", "insurance_date");
    await queryInterface.removeColumn("vehicles", "pollution_date");
    await queryInterface.removeColumn("vehicles", "rc_date");
    await queryInterface.removeColumn("vehicles", "fc_date");
    await queryInterface.removeColumn("vehicles", "next_service_date");
  },
};

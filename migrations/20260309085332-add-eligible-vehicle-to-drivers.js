'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('drivers', 'eligible_vehicle', {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: 'salary'
    });

    await queryInterface.addColumn('drivers', 'address', {
      type: Sequelize.TEXT,
      allowNull: true,
      after: 'eligible_vehicle'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('drivers', 'eligible_vehicle');
    await queryInterface.removeColumn('drivers', 'address');
  }
};
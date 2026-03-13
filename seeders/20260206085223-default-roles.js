"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "roles",
      [
        {
          name: "Transport Admin",
        },
        {
          name: "Faculty",
        },
        {
          name: "Driver",
        },
      ],
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "roles",
      {
        name: ["Super Admin", "Transport Admin", "Driver", "Faculty"],
      },
      {},
    );
  },
};

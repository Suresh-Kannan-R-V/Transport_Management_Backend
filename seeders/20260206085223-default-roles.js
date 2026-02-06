"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "roles",
      [
        {
          name: "Super Admin",
        },
        {
          name: "Transport Admin",
        },
        {
          name: "Driver",
        },
        {
          name: "Faculty",
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

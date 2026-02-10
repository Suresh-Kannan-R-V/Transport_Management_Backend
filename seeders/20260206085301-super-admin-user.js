"use strict";

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

module.exports = {
  async up(queryInterface, Sequelize) {
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name = 'Super Admin' LIMIT 1`
    );

    if (!roles.length) {
      throw new Error("Super Admin role not found. Run roles seeder first.");
    }

    const roleId = roles[0].id;

    const token = jwt.sign(
      {
        id: 1,
        role: "Super Admin",
      },
      process.env.JWT_SECRET || "sureshaswath05!"
    );

    await queryInterface.bulkInsert(
      "users",
      [
        {
          name: "Suresh Kannan R V",
          email: "sureshkannan.cs23@bitsathy.ac.in",
          phone: "9025763629",
          role_id: roleId,
          status: "active",
          isLogin: true,
          token: token,
          created_at: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "users",
      {
        email: "sureshkannan.cs23@bitsathy.ac.in",
      },
      {}
    );
  },
};

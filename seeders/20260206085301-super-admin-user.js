"use strict";

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

module.exports = {
  async up(queryInterface, Sequelize) {
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id, name FROM roles WHERE name = 'Transport Admin' LIMIT 1`
    );

    if (!roles.length) {
      throw new Error("Super Admin role not found. Run roles seeder first.");
    }

    const role = roles[0];

    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    await queryInterface.bulkInsert("users", [
      {
        role_id: role.id,
        name: "Suresh Kannan R V",
        user_name: "Suresh@05",
        email: "sureshkannan.cs23@bitsathy.ac.in",
        password: hashedPassword,
        phone: "9025763629",
        isLogin: true,
        created_at: new Date(),
      },
    ]);

    const [users] = await queryInterface.sequelize.query(
      `SELECT * FROM users WHERE email = 'sureshkannan.cs23@bitsathy.ac.in' LIMIT 1`
    );

    if (!users.length) {
      throw new Error("User insert failed.");
    }

    const insertedUser = users[0];

    const token = jwt.sign(
      {
        id: insertedUser.id,
        name: insertedUser.name,
        user_name: insertedUser.user_name,
        email: insertedUser.email,
        role: role.name,
      },
      process.env.JWT_SECRET || "sureshaswath05!"
    );

    await queryInterface.bulkUpdate(
      "users",
      { token: token },
      { id: insertedUser.id }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("users", {
      email: "sureshkannan.cs23@bitsathy.ac.in",
    });
  },
};

const { User, Driver, Role } = require("../models");
const bcrypt = require("bcryptjs");

/** 
 * Create User
 * Roles: Super Admin, Transport Admin, Driver, Faculty
 */
exports.createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role_id,
      phone
    } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role_id,
      created_by: req.user.id
    });

    return res.status(201).json({
      msg: "User created successfully",
      data: user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "User creation failed" });
  }
};

/**
 * ✏️ Update User
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    await User.update(
      {
        ...req.body,
        updated_by: req.user.id
      },
      { where: { id } }
    );

    res.json({ msg: "User updated successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Update failed" });
  }
};

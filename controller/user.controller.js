const { Op } = require("sequelize");
const { User, Driver, Role } = require("../models");
const bcrypt = require("bcryptjs");

/**
 * Create User
 * Roles: Super Admin, Transport Admin, Driver, Faculty
 */
exports.createUser = async (req, res) => {
  try {
    const { name, email, role_id, phone } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    const user = await User.create({
      name,
      email,
      phone,
      role_id,
      created_by: req.user.id,
    });

    return res.status(201).json({
      msg: "User created successfully",
      data: user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "User creation failed" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    await User.update(
      {
        ...req.body,
        updated_by: req.user.id,
      },
      { where: { id } },
    );

    res.json({ msg: "User updated successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Update failed" });
  }
};


exports.getUserData = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({
      where: { id },
      attributes: { exclude: ["token"] },
      include: [
        {
          model: Role,
          attributes: ["id", "name"],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error("Get user error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};



exports.getAllUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;
    const loggedInRole = req.user.role;

    // Only Super Admin can access
    if (loggedInRole !== "Super Admin" && loggedInRole !== "Transport Admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const users = await User.findAll({
      where: {
        id: { [Op.ne]: loggedInUserId },
      },
      attributes: {
        exclude: ["token"],
      },
      include: [
        {
          model: Role,
          attributes: ["id", "name"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (err) {
    console.error("Get all users error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
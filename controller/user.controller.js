const { Op } = require("sequelize");
const { User, Driver, Role } = require("../models");
const bcrypt = require("bcryptjs");
const generateUsernameFromEmail = require("../utils/helper");

/**
 * Create User
 * Roles: Super Admin, Transport Admin, Driver, Faculty
 */
exports.createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      role_id,
      phone,
      password,
      user_name,
      faculty_id,
      destination,
      department,
      push_notification_status,
    } = req.body;

    // 1️⃣ Check email already exists
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ msg: "Email already exists" });
    }

    // 2️⃣ Determine username
    let finalUsername = user_name;

    if (!finalUsername) {
      finalUsername = generateUsernameFromEmail(email);
    }

    const existingUsername = await User.findOne({
      where: { user_name: finalUsername },
    });

    if (existingUsername) {
      return res.status(400).json({ msg: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      role_id,
      name,
      user_name: finalUsername,
      email,
      password: hashedPassword,
      phone,
      isLogin: false,
      faculty_id: faculty_id ?? null,
      destination: destination ?? null,
      department: department ?? null,
      push_notification_status:
        push_notification_status !== undefined
          ? push_notification_status
          : true,
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
    const { id, user_name, email, password, ...otherFields } = req.body;

    // 🔎 Must provide at least one identifier
    if (!id && !user_name && !email) {
      return res.status(400).json({
        msg: "Provide id OR user_name OR email to update user",
      });
    }

    // 🔎 Find user
    const user = await User.findOne({
      where: {
        [Op.or]: [
          id ? { id } : null,
          user_name ? { user_name } : null,
          email ? { email } : null,
        ].filter(Boolean),
      },
    });

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    let updateData = {
      ...otherFields,
      updated_by: req.user.id,
    };

    // 🔐 If password present → hash it
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    await user.update(updateData);

    res.json({
      msg: "User updated successfully",
      data: user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      msg: "Update failed",
    });
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
      order: [["created_at", "ASC"]],
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

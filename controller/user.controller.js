const XLSX = require("xlsx");
const { Op } = require("sequelize");
const { User, Driver, Role, sequelize } = require("../models");
const bcrypt = require("bcryptjs");
const { generateUsernameFromEmail } = require("../utils/helper");

//  Create User
exports.createUser = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    let usersData = [];

    if (req.file) {
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (!rows.length) throw new Error("Uploaded file is empty");

      usersData = rows;
    } else {
      usersData = [req.body];
    }

    const createdUsers = [];

    for (let index = 0; index < usersData.length; index++) {
      const data = usersData[index];

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
        age,
        license_number,
        license_expiry,
        experience_years,
        blood_group,
        salary,
      } = data;

      if (!name || !email || !password || !role_id) {
        throw new Error(
          usersData.length > 1
            ? `Row ${index + 2}: name, email, password, role_id required`
            : "name, email, password and role_id are required",
        );
      }

      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) throw new Error("Email already exists");

      const existingPhone = await User.findOne({ where: { phone } });
      if (existingPhone) throw new Error("Phone number already exists");

      let finalUsername = user_name || generateUsernameFromEmail(email);

      const existingUsername = await User.findOne({
        where: { user_name: finalUsername },
      });

      if (existingUsername) throw new Error("Username already exists");

      const role = await Role.findByPk(role_id);
      if (!role) throw new Error("Invalid role");

      const roleName = role.name.toLowerCase();

      if (roleName === "faculty") {
        if (!faculty_id || !destination || !department) {
          throw new Error(
            "faculty_id, destination and department are required for Faculty",
          );
        }
      }

      if (roleName === "driver") {
        if (
          !license_number ||
          !license_expiry ||
          experience_years === undefined ||
          !blood_group ||
          salary === undefined
        ) {
          throw new Error(
            "license_number, license_expiry, experience_years, blood_group and salary are required for Driver",
          );
        }

        const cleanLicense = license_number.trim();
        const existingLicense = await Driver.findOne({
          where: { license_number: cleanLicense },
        });

        if (existingLicense) throw new Error("License number already exists");
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create(
        {
          role_id,
          name,
          user_name: finalUsername,
          email,
          password: hashedPassword,
          phone,
          age,
          isLogin: false,
          faculty_id: roleName === "faculty" ? faculty_id : null,
          destination: roleName === "faculty" ? destination : null,
          department: roleName === "faculty" ? department : null,
          push_notification_status:
            push_notification_status !== undefined
              ? push_notification_status
              : true,
        },
        { transaction: t },
      );

      if (roleName === "driver") {
        await Driver.create(
          {
            user_id: user.id,
            license_number,
            license_expiry,
            experience_years,
            blood_group,
            salary,
            status: 1, // 1 = AVAILABLE
          },
          { transaction: t },
        );
      }

      createdUsers.push(user);
    }

    await t.commit();

    return res.status(201).json({
      success: true,
      message:
        createdUsers.length > 1
          ? "Bulk users created successfully"
          : "User created successfully",
      count: createdUsers.length,
      data: createdUsers,
    });
  } catch (err) {
    await t.rollback();

    console.log(err);
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id, user_name, email, password, ...otherFields } = req.body;

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

exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findOne({
      where: { id: userId },
      attributes: { exclude: ["password", "token"] },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.json({
      message: "User profile fetched successfully",
      data: user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to fetch profile",
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

    if (loggedInRole !== "Transport Admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const search = req.query.search?.trim() || "";
    const isLogin = req.query.isLogin; // true / false
    const roleId = req.query.role; // role id
    const roleName = req.query.role_name;

    let whereCondition = {
      id: { [Op.ne]: loggedInUserId },
    };

    if (search) {
      whereCondition[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { user_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    if (isLogin !== undefined) {
      whereCondition.isLogin = isLogin === "true";
    }
    let roleWhere = {};
    if (roleId) {
      roleWhere.id = parseInt(roleId, 10);
    }
    if (roleName) {
      roleWhere.name = {
        [Op.like]: `%${roleName}%`,
      };
    }

    const { rows, count } = await User.findAndCountAll({
      where: whereCondition,
      attributes: {
        exclude: ["password","token"],
      },
      include: [
        {
          model: Role,
          attributes: ["id", "name"],
          required: Object.keys(roleWhere).length > 0,
          where: Object.keys(roleWhere).length ? roleWhere : undefined,
        },
      ],
      limit,
      offset,
      distinct: true,
      order: [["created_at", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      totalItems: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      data: rows,
    });
  } catch (err) {
    console.error("Get all users error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({
      attributes: ["id", "name"],
      order: [["id", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      count: roles.length,
      data: roles,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch roles",
      error: error.message,
    });
  }
};

exports.changeUserRole = async (req, res) => {
  try {
    const adminId = req.user.id;
    const adminRole = req.user.role;

    const { user_id, password, new_role_id } = req.body;

    if (!user_id || !password || !new_role_id) {
      return res.status(400).json({
        success: false,
        message: "user_id, password and new_role_id are required",
      });
    }

    if (adminRole !== "Transport Admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Transport Admin allowed.",
      });
    }

    const adminUser = await User.findByPk(adminId);
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, adminUser.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid admin password",
      });
    }

    const targetUser = await User.findByPk(user_id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found",
      });
    }

    const role = await Role.findByPk(new_role_id);
    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    if (adminId === targetUser.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role",
      });
    }

    await targetUser.update({
      role_id: new_role_id,
    });

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: {
        user_id: targetUser.id,
        new_role: role.name,
      },
    });
  } catch (error) {
    console.error("Change role error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

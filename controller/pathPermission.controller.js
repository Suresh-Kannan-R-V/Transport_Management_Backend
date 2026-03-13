const { Role, Permission } = require("../models");

const getRolePermissions = async (req, res) => {
  try {
    const userRole = req.user.role;

    if (!userRole) {
      return res.status(400).json({ msg: "Role information missing in token" });
    }

    const roleWithPermissions = await Role.findOne({
      where: { name: userRole },
      include: [
        {
          model: Permission,
          through: { attributes: [] },
          attributes: ["id", "name", "path", "is_active"],
        },
      ],
    });

    if (!roleWithPermissions) {
      return res.status(404).json({ msg: "Role not found" });
    }

    const activePermissions = roleWithPermissions.Permissions.filter(p => p.is_active);

    return res.status(200).json({
      role: roleWithPermissions.name,
      permissions: activePermissions,
    });
  } catch (err) {
    console.error("Error fetching role permissions:", err);
    return res.status(500).json({ msg: "Internal server error" });
  }
};

module.exports = { getRolePermissions };
module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define(
    "Role",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false, unique: true },
    },
    {
      timestamps: false, // 🔥 IMPORTANT FIX
      tableName: "roles",
    },
  );

  Role.associate = (models) => {
    Role.hasMany(models.User, { foreignKey: "role_id" });
    Role.belongsToMany(models.Permission, {
      through: "role_permissions",
      foreignKey: "role_id",
    });
  };

  return Role;
};

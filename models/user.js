module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      role_id: { type: DataTypes.INTEGER },
      name: DataTypes.STRING,
      user_name: { type: DataTypes.STRING, unique: true },
      email: { type: DataTypes.STRING, unique: true },
      password: DataTypes.STRING,
      phone: { type: DataTypes.STRING, unique: true },
      age: { type: DataTypes.INTEGER, defaultValue: 0 },
      isLogin: DataTypes.BOOLEAN,
      token: DataTypes.TEXT,

      faculty_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      destination: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      department: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      push_notification_status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    { timestamps: true, createdAt: "created_at", updatedAt: "updated_at" },
  );

  User.associate = (models) => {
    User.belongsTo(models.Role, { foreignKey: "role_id" });
    User.hasOne(models.Driver, { foreignKey: "user_id" });
    User.hasMany(models.Notification, { foreignKey: "user_id" });
    User.hasMany(models.LeaveRequest, { foreignKey: "user_id" });
    User.hasMany(models.RouteOtp, {
      foreignKey: "created_by",
      as: "route_otps",
    });
  };

  return User;
};

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      role_id: { type: DataTypes.INTEGER },
      name: DataTypes.STRING,
      email: { type: DataTypes.STRING, unique: true },
      phone: DataTypes.STRING,
      isLogin: DataTypes.BOOLEAN,
      token: DataTypes.TEXT,
      status: DataTypes.STRING,
    },
    { timestamps: true, createdAt: "created_at", updatedAt: false },
  );

  User.associate = (models) => {
    User.belongsTo(models.Role, { foreignKey: "role_id" });
    User.hasOne(models.Driver, { foreignKey: "user_id" });
    User.hasMany(models.Booking, { foreignKey: "user_id" });
    User.hasMany(models.Notification, { foreignKey: "user_id" });
    User.hasMany(models.LeaveRequest, { foreignKey: "user_id" });
  };

  return User;
};

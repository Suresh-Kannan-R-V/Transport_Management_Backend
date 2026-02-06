module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define("Notification", {
    message: DataTypes.TEXT,
    is_read: DataTypes.BOOLEAN
  }, { timestamps: true, createdAt: "created_at", updatedAt: false });

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, { foreignKey: "user_id" });
  };

  return Notification;
};

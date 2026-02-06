module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define("AuditLog", {
    action: DataTypes.STRING,
    entity: DataTypes.STRING,
    entity_id: DataTypes.INTEGER
  }, { timestamps: true, createdAt: "created_at", updatedAt: false });

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, { foreignKey: "admin_id" });
  };

  return AuditLog;
};

module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    "AuditLog",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      action: DataTypes.STRING,
      entity: DataTypes.STRING,
      entity_id: DataTypes.INTEGER,
      admin_id: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
    },
    {
      tableName: "audit_logs",
      timestamps: false,
    },
  );

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, { foreignKey: "admin_id" });
  };

  return AuditLog;
};

module.exports = (sequelize, DataTypes) => {
  const UsageHistory = sequelize.define(
    "UsageHistory",
    {
      usage_date: DataTypes.DATE,
      distance_km: DataTypes.INTEGER,
      remarks: DataTypes.TEXT,
    },
    {
      tableName: "usage_history",
      timestamps: false,
    },
  );

  UsageHistory.associate = (models) => {
    UsageHistory.belongsTo(models.Vehicle, { foreignKey: "vehicle_id" });
    UsageHistory.belongsTo(models.Driver, { foreignKey: "driver_id" });
    UsageHistory.belongsTo(models.Schedule, { foreignKey: "schedule_id" });
  };

  return UsageHistory;
};

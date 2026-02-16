module.exports = (sequelize, DataTypes) => {
  const LeaveRequest = sequelize.define(
    "LeaveRequest",
    {
      leave_date: DataTypes.DATE,
      reason: DataTypes.TEXT,
      status: DataTypes.STRING,
    },
    {
      tableName: "leave_requests",
      timestamps: false,
    },
  );

  LeaveRequest.associate = (models) => {
    LeaveRequest.belongsTo(models.User, { foreignKey: "user_id" });
    LeaveRequest.belongsTo(models.Schedule, { foreignKey: "schedule_id" });
  };

  return LeaveRequest;
};

module.exports = (sequelize, DataTypes) => {
  const Schedule = sequelize.define("Schedule", {
    schedule_date: DataTypes.DATE,
    start_time: DataTypes.TIME,
    end_time: DataTypes.TIME,
    status: DataTypes.STRING
  });

  Schedule.associate = (models) => {
    Schedule.belongsTo(models.Route, { foreignKey: "route_id" });
    Schedule.belongsTo(models.Vehicle, { foreignKey: "vehicle_id" });
    Schedule.belongsTo(models.Driver, { foreignKey: "driver_id" });
    Schedule.hasMany(models.Booking, { foreignKey: "schedule_id" });
  };

  return Schedule;
};

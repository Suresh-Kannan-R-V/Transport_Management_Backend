module.exports = (sequelize, DataTypes) => {
  const RouteStop = sequelize.define("RouteStop", {
    stop_name: DataTypes.STRING,
    stop_order: DataTypes.INTEGER,
    pickup_time: DataTypes.TIME
  });

  RouteStop.associate = (models) => {
    RouteStop.belongsTo(models.Route, { foreignKey: "route_id" });
  };

  return RouteStop;
};

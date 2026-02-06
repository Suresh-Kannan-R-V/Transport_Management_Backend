module.exports = (sequelize, DataTypes) => {
  const Route = sequelize.define("Route", {
    route_name: DataTypes.STRING,
    description: DataTypes.TEXT
  });

  Route.associate = (models) => {
    Route.hasMany(models.RouteStop, { foreignKey: "route_id" });
    Route.hasMany(models.Schedule, { foreignKey: "route_id" });
  };

  return Route;
};

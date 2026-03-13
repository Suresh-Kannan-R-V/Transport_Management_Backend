module.exports = (sequelize, DataTypes) => {
  const RouteStop = sequelize.define(
    "RouteStop",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      route_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      stop_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      stop_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      pickup_time: {
        type: DataTypes.TIME,
        allowNull: true,
      },
    },
    {
      tableName: "route_stops",
      timestamps: false,
    }
  );

  RouteStop.associate = (models) => {
    RouteStop.belongsTo(models.Route, {
      foreignKey: "route_id",
    });
  };

  return RouteStop;
};

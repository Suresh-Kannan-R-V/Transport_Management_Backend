module.exports = (sequelize, DataTypes) => {
  const Vehicle = sequelize.define(
    "Vehicle",
    {
      vehicle_number: { type: DataTypes.STRING, unique: true },
      vehicle_type: DataTypes.STRING,
      capacity: DataTypes.INTEGER,
      status: DataTypes.STRING,
    },
    {
      tableName: "vehicles",
      timestamps: false,
    },
  );

  Vehicle.associate = (models) => {
    Vehicle.hasMany(models.Schedule, { foreignKey: "vehicle_id" });
    Vehicle.hasMany(models.VehicleMaintenance, { foreignKey: "vehicle_id" });
    Vehicle.hasMany(models.UsageHistory, {
      foreignKey: "vehicle_id",
    });
  };

  return Vehicle;
};

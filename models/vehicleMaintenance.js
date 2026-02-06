module.exports = (sequelize, DataTypes) => {
  const VehicleMaintenance = sequelize.define("VehicleMaintenance", {
    maintenance_date: DataTypes.DATE,
    description: DataTypes.TEXT,
    status: DataTypes.STRING
  });

  VehicleMaintenance.associate = (models) => {
    VehicleMaintenance.belongsTo(models.Vehicle, { foreignKey: "vehicle_id" });
  };

  return VehicleMaintenance;
};

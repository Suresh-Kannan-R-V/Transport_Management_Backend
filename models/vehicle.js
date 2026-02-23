module.exports = (sequelize, DataTypes) => {
  const Vehicle = sequelize.define(
    "Vehicle",
    {
      vehicle_number: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },

      vehicle_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "active",
      },

      current_kilometer: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      insurance_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      pollution_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      rc_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      fc_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      next_service_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
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

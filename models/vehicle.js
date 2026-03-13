module.exports = (sequelize, DataTypes) => {
  const Vehicle = sequelize.define(
    "Vehicle",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      vehicle_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
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
        defaultValue: 0,
      },

      total_kilometer_runs: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
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

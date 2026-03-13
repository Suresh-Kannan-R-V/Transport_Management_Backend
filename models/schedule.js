module.exports = (sequelize, DataTypes) => {
  const Schedule = sequelize.define(
    "Schedule",
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

      vehicle_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      driver_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      allocated_passenger_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      start_datetime: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      end_datetime: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      status: {
        type: DataTypes.STRING,
        defaultValue: "vehicle_assigned",
      },

      approved_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      approved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "schedules",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  Schedule.associate = (models) => {
    Schedule.belongsTo(models.Route, {
      foreignKey: "route_id",
    });

    Schedule.belongsTo(models.Vehicle, {
      foreignKey: "vehicle_id",
    });

    Schedule.belongsTo(models.Driver, {
      foreignKey: "driver_id",
    });

    Schedule.belongsTo(models.User, {
      foreignKey: "approved_by",
       as: "approver",
    });

    Schedule.hasMany(models.Booking, {
      foreignKey: "schedule_id",
    });
  };

  return Schedule;
};

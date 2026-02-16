module.exports = (sequelize, DataTypes) => {
  const Route = sequelize.define(
    "Route",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      route_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      travel_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      start_datetime: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      end_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      approx_distance_km: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },

      approx_duration_minutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      passenger_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      luggage_details: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      status: {
        type: DataTypes.STRING,
        defaultValue: "pending",
      },

      faculty_remark: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      admin_remark: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "routes",
      timestamps: false,
    },
  );

  Route.associate = (models) => {
    Route.belongsTo(models.User, {
      foreignKey: "created_by",
      as: "creator",
    });

    Route.hasMany(models.RouteStop, {
      foreignKey: "route_id",
    });

    Route.hasMany(models.Schedule, {
      foreignKey: "route_id",
    });

    Route.hasMany(models.Booking, {
      foreignKey: "route_id",
    });
  };

  return Route;
};

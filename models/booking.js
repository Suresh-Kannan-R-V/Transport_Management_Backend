module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define(
    "Booking",
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

      schedule_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      guest_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      country_code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      guest_phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      seat_number: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      is_primary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      booking_status: {
        type: DataTypes.STRING,
        defaultValue: "active",
      },

      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "bookings",
      timestamps: false,
    },
  );

  Booking.associate = (models) => {
    Booking.belongsTo(models.Route, {
      foreignKey: "route_id",
    });

    Booking.belongsTo(models.Schedule, {
      foreignKey: "schedule_id",
    });
  };

  return Booking;
};

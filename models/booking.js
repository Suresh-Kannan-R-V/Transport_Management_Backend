module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define("Booking", {
    seat_number: DataTypes.INTEGER,
    booking_status: DataTypes.STRING
  }, { timestamps: true, createdAt: "created_at", updatedAt: false });

  Booking.associate = (models) => {
    Booking.belongsTo(models.User, { foreignKey: "user_id" });
    Booking.belongsTo(models.Schedule, { foreignKey: "schedule_id" });
  };

  return Booking;
};

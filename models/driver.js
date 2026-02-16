module.exports = (sequelize, DataTypes) => {
  const Driver = sequelize.define(
    "Driver",
    {
      license_number: DataTypes.STRING,
      license_expiry: DataTypes.DATE,
      experience_years: DataTypes.INTEGER,
      status: DataTypes.STRING,
    },
    {
      tableName: "drivers",
      timestamps: false,
    },
  );

  Driver.associate = (models) => {
    Driver.belongsTo(models.User, { foreignKey: "user_id" });
    Driver.hasMany(models.Schedule, { foreignKey: "driver_id" });
  };

  return Driver;
};

module.exports = (sequelize, DataTypes) => {
  const Driver = sequelize.define(
    "Driver",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      license_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },

      license_expiry: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      experience_years: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      blood_group: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      total_kilometer_drived: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },

      total_routes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      salary: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },

      eligible_vehicle: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
    },
    {
      tableName: "drivers",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  Driver.associate = (models) => {
    Driver.belongsTo(models.User, { foreignKey: "user_id" });
    Driver.hasMany(models.Schedule, { foreignKey: "driver_id" });
  };

  return Driver;
};

module.exports = (sequelize, DataTypes) => {
  const AppVersionSetup = sequelize.define(
    "AppVersionSetup",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      platform: {
        type: DataTypes.ENUM("ANDROID", "IOS"),
        allowNull: false,
      },

      current_version: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      minimum_supported_version: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      force_update: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      maintenance_mode: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "app_version_setups",
      underscored: true,
      timestamps: true,
    },
  );

  return AppVersionSetup;
};

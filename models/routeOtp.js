module.exports = (sequelize, DataTypes) => {
  const RouteOtp = sequelize.define(
    "RouteOtp",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      route_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      otp_code: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },

      otp_type: {
        type: DataTypes.ENUM("START", "END"),
        allowNull: false,
      },

      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "route_otps",
      timestamps: false,
    },
  );

  RouteOtp.associate = (models) => {
    RouteOtp.belongsTo(models.Route, {
      foreignKey: "route_id",
      as: "route",
    });

    RouteOtp.belongsTo(models.User, {
      foreignKey: "created_by",
      targetKey: "id",
      as: "creator",
    });
  };

  return RouteOtp;
};

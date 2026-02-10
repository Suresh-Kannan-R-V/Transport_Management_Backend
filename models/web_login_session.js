module.exports = (sequelize, DataTypes) => {
  const WebLoginSession = sequelize.define(
    "WebLoginSession",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      status: {
        type: DataTypes.ENUM("PENDING", "APPROVED", "EXPIRED"),
        defaultValue: "PENDING",
      },
      web_access_expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "web_login_sessions",
      underscored: true,
      timestamps: true,
    },
  );

  WebLoginSession.associate = (models) => {
    WebLoginSession.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
  };

  return WebLoginSession;
};

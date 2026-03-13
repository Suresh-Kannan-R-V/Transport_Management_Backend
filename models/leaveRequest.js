module.exports = (sequelize, DataTypes) => {
  const LeaveRequest = sequelize.define(
    "LeaveRequest",
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

      from_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      to_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      total_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      leave_type: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      //1=Sick, 2=Casual, 3=Emergency, 4=Other
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      // 1=Pending, 2=Approved, 3=Rejected

      approved_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      approved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "leave_requests",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  LeaveRequest.associate = (models) => {
    LeaveRequest.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "driver",
    });

    LeaveRequest.belongsTo(models.User, {
      foreignKey: "approved_by",
      as: "approver",
    });
  };

  return LeaveRequest;
};

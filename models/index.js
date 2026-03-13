"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const process = require("process");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.json")[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config,
  );
}

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file.slice(-3) === ".js" &&
      file.indexOf(".test.js") === -1
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes,
    );
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// ROLE ↔ USER
db.Role.hasMany(db.User, { foreignKey: "role_id" });
db.User.belongsTo(db.Role, { foreignKey: "role_id" });

//USER ↔ WEB LOGIN
db.User.hasMany(db.WebLoginSession, { foreignKey: "user_id" });
db.WebLoginSession.belongsTo(db.User, { foreignKey: "user_id" });

// USER ↔ DRIVER
db.User.hasOne(db.Driver, { foreignKey: "user_id" });
db.Driver.belongsTo(db.User, { foreignKey: "user_id" });

db.Schedule.hasMany(db.Booking, { foreignKey: "schedule_id" });
db.Booking.belongsTo(db.Schedule, { foreignKey: "schedule_id" });

// USER ↔ LEAVE_REQUESTS
db.User.hasMany(db.LeaveRequest, { foreignKey: "user_id" });
db.LeaveRequest.belongsTo(db.User, { foreignKey: "user_id" });

// USER ↔ NOTIFICATIONS
db.User.hasMany(db.Notification, { foreignKey: "user_id" });
db.Notification.belongsTo(db.User, { foreignKey: "user_id" });

// USER (ADMIN) ↔ AUDIT_LOGS
db.User.hasMany(db.AuditLog, { foreignKey: "admin_id" });
db.AuditLog.belongsTo(db.User, { foreignKey: "admin_id"});

db.Driver.hasMany(db.UsageHistory, { foreignKey: "driver_id" });
db.UsageHistory.belongsTo(db.Driver, { foreignKey: "driver_id" });

db.Schedule.hasMany(db.UsageHistory, { foreignKey: "schedule_id" });
db.UsageHistory.belongsTo(db.Schedule, { foreignKey: "schedule_id" });

module.exports = db;

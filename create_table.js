const { sequelize } = require("./models");

(async () => {
  try {
    await sequelize.sync();
    console.log("✅ All tables created");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

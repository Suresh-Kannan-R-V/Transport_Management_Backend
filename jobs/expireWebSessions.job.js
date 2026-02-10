const { WebLoginSession } = require("../models");
const { Op } = require("sequelize");

const expireWebLoginSessions = async () => {
  try {
    await WebLoginSession.update(
      { status: "EXPIRED" },
      {
        where: {
          status: "PENDING",
          expires_at: { [Op.lt]: new Date() },
        },
      }
    );
    console.log("Expired old web login sessions");
  } catch (err) {
    console.error("Session expire error:", err);
  }
};

module.exports = expireWebLoginSessions;
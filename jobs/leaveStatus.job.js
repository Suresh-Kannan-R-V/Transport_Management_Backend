const cron = require("node-cron");
const { LeaveRequest, Driver } = require("../models");
const { Op } = require("sequelize");
const { DRIVER_STATUS, LEAVE_STATUS } = require("../utils/helper");

const updateDriverStatusAfterLeave = () => {
  cron.schedule("0 0 * * *", async () => {

    try {
      const today = new Date();

      const expiredLeaves = await LeaveRequest.findAll({
        where: {
          status: LEAVE_STATUS.APPROVED,
          to_date: {
            [Op.lt]: today,
          },
        },
      });

      for (let leave of expiredLeaves) {
        await Driver.update(
          { status: DRIVER_STATUS.AVAILABLE },
          { where: { user_id: leave.user_id } },
        );
      }

      console.log("Driver status auto updated");
    } catch (error) {
      console.error("Cron Job Error:", error);
    }
  });
};

module.exports = updateDriverStatusAfterLeave;

const express = require("express");
const router = express.Router();

router.use("/drivers", require("./driver.routes"));
router.use("/vehicles", require("./vehicle.routes"));
router.use("/routes", require("./route.routes"));
router.use("/schedules", require("./schedule.routes"));
router.use("/bookings", require("./booking.routes"));
router.use("/leaves", require("./leave.routes"));

module.exports = router;

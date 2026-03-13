const express = require("express");
const router = express.Router();

router.use("/drivers", require("./driver.routes"));
router.use("/vehicles", require("./vehicle.routes"));
router.use("/leaves", require("./leave.routes"));

module.exports = router;

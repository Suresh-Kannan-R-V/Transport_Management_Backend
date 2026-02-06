const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const role = require("../middleware/role");
const scheduleController = require("../controller/schedule.controller");

// Create schedule
router.post(
  "/",
  auth,
  role("Super Admin", "Transport Admin"),
  scheduleController.createSchedule
);

// Update schedule
router.put(
  "/:id",
  auth,
  role("Super Admin", "Transport Admin"),
  scheduleController.updateSchedule
);

module.exports = router;

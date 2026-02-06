const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const scheduleController = require("../controllers/schedule.controller");

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

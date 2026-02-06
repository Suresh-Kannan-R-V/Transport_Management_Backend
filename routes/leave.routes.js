const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const leaveController = require("../controllers/leave.controller");

// Create leave request
router.post("/", auth, role("Faculty", "Driver"), leaveController.createLeave);

// Approve / Reject leave
router.put(
  "/:id/status",
  auth,
  role("Super Admin", "Transport Admin"),
  leaveController.updateLeaveStatus,
);

module.exports = router;

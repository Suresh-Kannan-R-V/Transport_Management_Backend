const express = require("express");
const router = express.Router();

const auth = require("../middleware/sessionAuth.middleware");
const role = require("../middleware/role");
const leaveController = require("../controller/leave.controller");

router.post(
  "/create",
  auth,
  role("Transport Admin", "Driver"),
  leaveController.createLeave,
);

router.get("/me", auth, role("Driver"), leaveController.getMyLeaves);
router.get(
  "/today-driver-count",
  auth,
  role("Transport Admin"),
  leaveController.getDriverAttendanceToday,
);
router.get(
  "/get-all",
  auth,
  role("Transport Admin"),
  leaveController.getAllLeaves,
);

router.put(
  "/status/:id",
  auth,
  role("Transport Admin"),
  leaveController.updateLeaveStatus,
);

router.delete("delete/:id", auth, role("Driver"), leaveController.deleteLeave);

module.exports = router;

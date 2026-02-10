const express = require("express");
const router = express.Router();

const auth = require("../middleware/sessionAuth.middleware");
const role = require("../middleware/role");
const driverController = require("../controller/driver.controller");

// Create driver
router.post(
  "/",
  auth,
  role("Super Admin", "Transport Admin"),
  driverController.createDriver
);

// Update driver
router.put(
  "/:id",
  auth,
  role("Super Admin", "Transport Admin"),
  driverController.updateDriver
);

module.exports = router;

const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const driverController = require("../controllers/driver.controller");

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

const express = require("express");
const router = express.Router();

const auth = require("../middleware/sessionAuth.middleware");
const role = require("../middleware/role");
const upload = require("../middleware/upload.middleware");
const driverController = require("../controller/driver.controller");
const AiDriverController = require("../controller/AiDriverAdd.controller");

//Ai license checker
router.post(
  "/license-check",
  upload.fields([
    { name: "license_front", maxCount: 1 },
    { name: "license_back", maxCount: 1 },
  ]),
  AiDriverController.extractLicenseData,
);

// Update driver
router.put(
  "/:id",
  auth,
  role("Transport Admin"),
  driverController.updateDriver,
);
router.get(
  "/all-drivers",
  auth,
  role("Transport Admin"),
  driverController.getAllDrivers,
);
router.delete(
  "/delete/:id",
  auth,
  role("Transport Admin"),
  driverController.deleteDriver,
);
router.get(
  "/driver-dashboard/:driverId",
  auth,
  role("Transport Admin"),
  driverController.getDriverDashboard,
);
router.get(
  "/driver-weekly-km/:driverId",
  auth,
  role("Transport Admin"),
  driverController.getDriverWeeklyKm,
);

module.exports = router;

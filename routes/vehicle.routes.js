const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const role = require("../middleware/role");
const vehicleController = require("../controller/vehicle.controller");

// Add vehicle
router.post(
  "/",
  auth,
  role("Super Admin", "Transport Admin"),
  vehicleController.createVehicle
);

// Update vehicle
router.put(
  "/:id",
  auth,
  role("Super Admin", "Transport Admin"),
  vehicleController.updateVehicle
);

module.exports = router;

const express = require("express");
const router = express.Router();

const auth = require("../middleware/sessionAuth.middleware");
const role = require("../middleware/role");
const vehicleController = require("../controller/vehicle.controller");
const upload = require("../middleware/upload.middleware");

router.post(
  "/create",
  auth,
  role("Transport Admin"),
  upload.single("file"),
  vehicleController.createVehicle,
);

router.delete(
  "/delete/:id",
  auth,
  role("Transport Admin"),
  vehicleController.deleteVehicle,
);

router.get(
  "/get-all",
  auth,
  role("Transport Admin"),
  vehicleController.getAllVehicles,
);

module.exports = router;

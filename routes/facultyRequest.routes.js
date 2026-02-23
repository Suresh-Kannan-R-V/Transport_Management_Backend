const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload.middleware");
const role = require("../middleware/role");
const controller = require("../controller/facultyRequest.controller");
const auth = require("../middleware/sessionAuth.middleware");

router.post(
  "/create-transport-request",
  auth,
  role("Transport Admin", "Faculty"),
  upload.single("file"),
  controller.createTransportRequest,
);

router.patch(
  "/cancel-transport-request/:route_id",
  auth,
  role("Faculty"),
  controller.cancelTransportRequest,
);

router.patch(
  "/uncancel-transport-request/:route_id",
  auth,
  role("Faculty", "Transport Admin"),
  controller.uncancelTransportRequest,
);

router.delete(
  "/delete-transport-request/:route_id",
  auth,
  role("Faculty", "Transport Admin"),
  controller.deleteTransportRequest,
);

router.get(
  "/get-all",
  auth,
  role("Transport Admin", "Faculty"),
  controller.getAllRoutes,
);

router.get(
  "/get-by-id/:route_id",
  auth,
  role("Transport Admin", "Faculty"),
  controller.getRouteById,
);

//Admin
router.post(
  "/assign-vehicles",
  auth,
  role("Transport Admin"),
  controller.assignVehicles,
);
router.put(
  "/update-assigned-vehicles",
  auth,
  role("Transport Admin"),
  controller.updateAssignedVehicles,
);

// Assign driver separately
router.patch(
  "/assign-driver",
  auth,
  role("Transport Admin"),
  controller.assignDriver,
);

// Change route status (approve / reject / complete)
router.patch(
  "/change-route-status",
  auth,
  role("Transport Admin"),
  controller.changeRouteStatus,
);

module.exports = router;

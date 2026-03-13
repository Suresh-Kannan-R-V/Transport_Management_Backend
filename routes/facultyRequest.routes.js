const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload.middleware");
const role = require("../middleware/role");
const facultyRequestController = require("../controller/facultyRequest.controller");
const assignRequestController = require("../controller/assignRoute.controller");
const auth = require("../middleware/sessionAuth.middleware");

router.post(
  "/create-transport-request",
  auth,
  role("Transport Admin", "Faculty"),
  upload.single("file"),
  facultyRequestController.createTransportRequest,
);

router.patch(
  "/cancel-transport-request/:route_id",
  auth,
  role("Faculty", "Transport Admin"),
  facultyRequestController.cancelTransportRequest,
);

router.patch(
  "/uncancel-transport-request/:route_id",
  auth,
  role("Faculty", "Transport Admin"),
  facultyRequestController.uncancelTransportRequest,
);

router.delete(
  "/delete-transport-request/:route_id",
  auth,
  role("Faculty", "Transport Admin"),
  facultyRequestController.deleteTransportRequest,
);

router.get(
  "/get-all",
  auth,
  role("Transport Admin", "Faculty"),
  facultyRequestController.getAllRoutes,
);

router.get(
  "/get-by-id/:route_id",
  auth,
  role("Transport Admin", "Faculty"),
  facultyRequestController.getRouteById,
);

//Admin
router.post(
  "/assign-vehicles",
  auth,
  role("Transport Admin", "Faculty"),
  assignRequestController.assignVehicles,
);
router.put(
  "/update-assigned-vehicles",
  auth,
  role("Transport Admin", "Faculty"),
  assignRequestController.updateAssignedVehicles,
);

// Assign driver separately
router.patch(
  "/assign-driver",
  auth,
  role("Transport Admin"),
  assignRequestController.assignDriver,
);
router.patch(
  "/update-driver-assign",
  auth,
  role("Transport Admin"),
  assignRequestController.updateDriverAssign,
);

// Change route status (approve / reject / complete)
router.patch(
  "/change-route-status",
  auth,
  role("Transport Admin", "Faculty"),
  assignRequestController.changeRouteStatus,
);

router.use("/", require("./routeStartOTP.routes"));

module.exports = router;

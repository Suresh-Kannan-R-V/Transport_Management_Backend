const router = require("express").Router();
const auth = require("../middleware/jwt.middleware");
const role = require("../middleware/role");

const routeStartController = require("../controller/routeStartOTP.controller");

router.post(
  "/generate-start-otp",
  auth,
  role("Transport Admin", "Faculty"),
  routeStartController.generateStartOTP,
);

router.post(
  "/start-route",
  auth,
  role("Driver"),
  routeStartController.startRoute,
);

router.post(
  "/generate-end-otp",
  auth,
  role("Transport Admin"),
  routeStartController.generateEndOTP,
);

router.post(
  "/complete-route-otp",
  auth,
  role("Driver"),
  routeStartController.completeRouteWithOTP,
);

router.post(
  "/complete-route-admin",
  auth,
  role("Transport Admin"),
  routeStartController.completeRouteDirect,
);

module.exports = router;

const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const role = require("../middleware/role");
const routeController = require("../controller/route.controller");

// Create route
router.post(
  "/",
  auth,
  role("Super Admin", "Transport Admin"),
  routeController.createRoute
);

// Update route
router.put(
  "/:id",
  auth,
  role("Super Admin", "Transport Admin"),
  routeController.updateRoute
);

module.exports = router;

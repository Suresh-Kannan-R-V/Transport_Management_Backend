const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const routeController = require("../controllers/route.controller");

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

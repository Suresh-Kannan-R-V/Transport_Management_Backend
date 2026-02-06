const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const role = require("../middleware/role");
const userController = require("../controller/user.controller");

// Create user (Super Admin only)
router.post("/register", auth, role("Super Admin"), userController.createUser);

// Update user (Super Admin, Transport Admin)
router.put(
  "/user/:id",
  auth,
  role("Super Admin", "Transport Admin"),
  userController.updateUser,
);

module.exports = router;

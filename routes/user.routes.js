const express = require("express");
const router = express.Router();

const auth = require("../middleware/sessionAuth.middleware");
const role = require("../middleware/role");
const userController = require("../controller/user.controller");

router.post("/register", auth, role("Super Admin"), userController.createUser);

router.put(
  "/user/:id",
  auth,
  role("Super Admin", "Transport Admin"),
  userController.updateUser,
);
router.get("/user/:id", auth, userController.getUserData);

router.get("/users", auth, role("Super Admin"), userController.getAllUsers);

module.exports = router;

const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload.middleware");
const auth = require("../middleware/sessionAuth.middleware");
const role = require("../middleware/role");
const userController = require("../controller/user.controller");

router.post(
  "/register",
  auth,
  role("Transport Admin"),
  upload.single("file"),
  userController.createUser,
);

router.put("/user", auth, role("Transport Admin"), userController.updateUser);
router.get("/user/me", auth, userController.getMyProfile);
router.get("/user/:id", auth, userController.getUserData);

router.get("/users", auth, role("Transport Admin"), userController.getAllUsers);
router.get("/roles", auth, role("Transport Admin"), userController.getAllRoles);
router.patch("/role-change", auth, role("Transport Admin"), userController.changeUserRole);

module.exports = router;

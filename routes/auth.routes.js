const express = require("express");
const router = express.Router();
const auth = require("../middleware/jwt.middleware");
const private = require("../middleware/sessionAuth.middleware");
const role = require("../middleware/role");

const authController = require("../controller/auth.controller");
const webController = require("../controller/webLogin.controller");

router.post("/google-login", authController.googleLogin);
router.post(
  "/logout-user",
  private,
  role("Super Admin"),
  authController.logoutUser,
);

router.post("/web-login-approve", auth, webController.approveWebLogin);

// Web creates session
router.post("/web-login-session", webController.createWebLoginSession);

// Web polls status
router.get("/web-login-session/:sessionId", webController.checkWebLoginSession);

router.get("/device-use", private, webController.getUserDevices);
router.post("/logout/:id", private, webController.logoutDevice);

module.exports = router;

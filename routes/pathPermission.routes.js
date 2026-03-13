const express = require("express");
const router = express.Router();
const permissionController = require("../controller/pathPermission.controller");
const auth = require("../middleware/sessionAuth.middleware");

router.get("/role-permissions", auth, permissionController.getRolePermissions);

module.exports = router;

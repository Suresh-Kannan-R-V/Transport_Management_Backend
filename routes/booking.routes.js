const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const role = require("../middleware/role");
const bookingController = require("../controller/booking.controller");

// Create booking (Faculty, Student)
router.post(
  "/",
  auth,
  role("Faculty", "Student"),
  bookingController.createBooking
);

module.exports = router;

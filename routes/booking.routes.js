const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const bookingController = require("../controllers/booking.controller");

// Create booking (Faculty, Student)
router.post(
  "/",
  auth,
  role("Faculty", "Student"),
  bookingController.createBooking
);

module.exports = router;

const { Booking } = require("../models");

exports.createBooking = async (req, res) => {
  try {
    const booking = await Booking.create({
      ...req.body,
      user_id: req.user.id
    });

    res.status(201).json({
      msg: "Booking successful",
      data: booking
    });
  } catch (err) {
    res.status(500).json({ msg: "Booking failed" });
  }
};

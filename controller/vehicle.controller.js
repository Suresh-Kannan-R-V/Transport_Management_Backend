const { Vehicle } = require("../models");

exports.createVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.create({
      ...req.body,
      created_by: req.user.id,
    });

    res.status(201).json({
      msg: "Vehicle added successfully",
      data: vehicle,
    });
  } catch (err) {
    res.status(500).json({ msg: "Vehicle creation failed" });
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    await Vehicle.update(
      {
        ...req.body,
        updated_by: req.user.id,
      },
      { where: { id } },
    );

    res.json({ msg: "Vehicle updated successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Update failed" });
  }
};

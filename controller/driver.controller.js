const { Driver, User } = require("../models");

exports.createDriver = async (req, res) => {
  try {
    const {
      user_id,
      license_no,
      license_expiry
    } = req.body;

    const driver = await Driver.create({
      user_id,
      license_no,
      license_expiry,
      created_by: req.user.id
    });

    res.status(201).json({
      msg: "Driver created successfully",
      data: driver
    });
  } catch (err) {
    res.status(500).json({ msg: "Driver creation failed" });
  }
};

exports.updateDriver = async (req, res) => {
  try {
    const { id } = req.params;

    await Driver.update(
      {
        ...req.body,
        updated_by: req.user.id
      },
      { where: { id } }
    );

    res.json({ msg: "Driver updated successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Update failed" });
  }
};

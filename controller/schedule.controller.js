const { Schedule } = require("../models");

exports.createSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.create({
      ...req.body,
      created_by: req.user.id
    });

    res.status(201).json({
      msg: "Schedule created successfully",
      data: schedule
    });
  } catch (err) {
    res.status(500).json({ msg: "Schedule creation failed" });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    await Schedule.update(
      {
        ...req.body,
        updated_by: req.user.id
      },
      { where: { id } }
    );

    res.json({ msg: "Schedule updated successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Update failed" });
  }
};

const { LeaveRequest } = require("../models");

exports.createLeave = async (req, res) => {
  try {
    const leave = await LeaveRequest.create({
      ...req.body,
      user_id: req.user.id
    });

    res.status(201).json({
      msg: "Leave request submitted",
      data: leave
    });
  } catch (err) {
    res.status(500).json({ msg: "Leave request failed" });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await LeaveRequest.update(
      {
        status,
        approved_by: req.user.id
      },
      { where: { id } }
    );

    res.json({ msg: "Leave status updated" });
  } catch (err) {
    res.status(500).json({ msg: "Update failed" });
  }
};

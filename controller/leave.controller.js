const {
  LeaveRequest,
  Driver,
  Schedule,
  Route,
  User,
  Vehicle,
} = require("../models");
const { Op } = require("sequelize");
const {
  LEAVE_STATUS,
  DRIVER_STATUS,
  LEAVE_TYPE,
  ROUTE_STATUS,
} = require("../utils/helper");

exports.createLeave = async (req, res) => {
  try {
    let driver;
    let user_id;

    if (req.user.role === "Driver") {
      driver = await Driver.findOne({
        where: { user_id: req.user.id },
      });

      if (!driver) {
        return res.status(404).json({
          success: false,
          message: "Driver not found",
        });
      }

      user_id = driver.user_id;
    } else if (req.user.role === "Transport Admin") {
      const { driver_id } = req.body;

      if (!driver_id) {
        return res.status(400).json({
          success: false,
          message: "driver_id is required",
        });
      }

      driver = await Driver.findOne({
        where: { id: driver_id },
      });

      if (!driver) {
        return res.status(404).json({
          success: false,
          message: "Driver not found",
        });
      }

      user_id = driver.user_id;
    }

    const { from_date, to_date, leave_type, reason } = req.body;

    if (!from_date || !to_date || leave_type === undefined) {
      return res.status(400).json({
        success: false,
        message: "from_date, to_date and leave_type are required",
      });
    }

    const validLeaveTypes = Object.values(LEAVE_TYPE);

    if (
      !Number.isInteger(leave_type) ||
      !validLeaveTypes.includes(leave_type)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid leave_type. Allowed values: 1=Sick, 2=Casual, 3=Emergency, 4=Other",
      });
    }

    if (new Date(from_date) > new Date(to_date)) {
      return res.status(400).json({
        success: false,
        message: "From date cannot be greater than To date",
      });
    }

    const start = new Date(from_date).getTime();
    const end = new Date(to_date).getTime();

    const diffInMs = end - start;

    const days = diffInMs / (1000 * 60 * 60 * 24);

    const total_days = days < 1 ? Number(days.toFixed(1)) : Math.ceil(days);

    const overlapping = await LeaveRequest.findOne({
      where: {
        user_id,
        status: { [Op.ne]: LEAVE_STATUS.REJECTED },
        [Op.or]: [
          {
            from_date: { [Op.lte]: to_date },
            to_date: { [Op.gte]: from_date },
          },
        ],
      },
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: "Leave already applied for selected dates",
      });
    }

    const leave = await LeaveRequest.create({
      user_id,
      from_date,
      to_date,
      total_days,
      leave_type,
      reason,
      status: LEAVE_STATUS.PENDING,
    });

    res.status(201).json({
      success: true,
      message: "Leave applied successfully",
      data: leave,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (![LEAVE_STATUS.APPROVED, LEAVE_STATUS.REJECTED].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const leave = await LeaveRequest.findByPk(id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    if (leave.status !== LEAVE_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: "Only pending leave can be updated",
      });
    }

    if (status === LEAVE_STATUS.APPROVED) {
      const driver = await Driver.findOne({
        where: { user_id: leave.user_id },
      });

      if (!driver) {
        return res.status(404).json({
          success: false,
          message: "Driver not found",
        });
      }

      const activeSchedule = await Schedule.findOne({
        where: {
          driver_id: driver.id,
        },
        include: [
          {
            model: Route,
            required: true,
            where: {
              status: {
                [Op.in]: [
                  ROUTE_STATUS.DRIVER_ASSIGNED,
                  ROUTE_STATUS.DRIVER_REASSIGNED,
                  ROUTE_STATUS.STARTED,
                ],
              },
            },
          },
        ],
      });

      if (activeSchedule) {
        return res.status(400).json({
          success: false,
          message:
            "Driver is still assigned to an active route. Please reassign before approving.",
        });
      }
    }

    leave.status = status;
    leave.approved_by = req.user.id;
    leave.approved_at = new Date();
    await leave.save();

    if (status === LEAVE_STATUS.APPROVED) {
      await Driver.update(
        { status: DRIVER_STATUS.ON_LEAVE },
        { where: { user_id: leave.user_id } },
      );
    }

    res.json({
      success: true,
      message: "Leave status updated successfully",
      data: leave,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteLeave = async (req, res) => {
  try {
    const { id } = req.params;

    const leave = await LeaveRequest.findByPk(id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    if (leave.status !== 1) {
      return res.status(400).json({
        success: false,
        message: "Only pending leave can be deleted",
      });
    }

    await leave.destroy();

    res.json({
      success: true,
      message: "Leave deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Delete failed",
      error: error.message,
    });
  }
};

exports.getMyLeaves = async (req, res) => {
  try {
    const user_id = req.user.id;

    const leaves = await LeaveRequest.findAll({
      where: { user_id },
      order: [["created_at", "DESC"]],
    });

    res.json({
      success: true,
      data: leaves,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Fetch failed",
      error: error.message,
    });
  }
};

exports.getAllLeaves = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search,
      status,
      leave_type,
      from_date,
      to_date,
      sort = "DESC",
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    const whereCondition = {};

    if (status) whereCondition.status = status;
    if (leave_type) whereCondition.leave_type = leave_type;

    if (from_date && to_date) {
      const startDate = new Date(from_date + "T00:00:00");
      const endDate = new Date(to_date + "T23:59:59");

      whereCondition.from_date = {
        [Op.gte]: startDate,
      };

      whereCondition.to_date = {
        [Op.lte]: endDate,
      };
    }

    const { count, rows } = await LeaveRequest.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: "driver",
          attributes: ["id", "name", "email"],
          where: search
            ? {
                [Op.or]: [
                  { name: { [Op.like]: `%${search}%` } },
                  { email: { [Op.like]: `%${search}%` } },
                ],
              }
            : undefined,
        },
        {
          model: User,
          as: "approver",
          attributes: ["id", "name"],
        },
      ],
      order: [["created_at", sort]],
      limit,
      offset,
    });

    const enhancedData = [];

    for (let leave of rows) {
      const driver = await Driver.findOne({
        where: { user_id: leave.user_id },
      });

      let assignmentInfo = null;

      if (driver) {
        const activeSchedule = await Schedule.findOne({
          where: {
            driver_id: driver.id,
          },
          include: [
            {
              model: Route,
              required: true,
              where: {
                status: {
                  [Op.notIn]: [ROUTE_STATUS.COMPLETED, ROUTE_STATUS.CANCELLED], // not COMPLETED or CANCELLED
                },
              },
              attributes: ["id", "route_name", "status", "travel_type"],
            },
            {
              model: Vehicle,
              attributes: ["id", "vehicle_number", "vehicle_type"],
            },
          ],
          attributes: [
            "id",
            "route_id",
            "vehicle_id",
            "driver_id",
            "start_datetime",
            "end_datetime",
          ],
        });

        if (activeSchedule) {
          assignmentInfo = {
            schedule_id: activeSchedule.id,
            driver_id: activeSchedule.driver_id,
            route_id: activeSchedule.route_id,
            vehicle: {
              id: activeSchedule.Vehicle.id,
              vehicle_number: activeSchedule.Vehicle.vehicle_number,
              vehicle_type: activeSchedule.Vehicle.vehicle_type,
            },
            route_status: activeSchedule.Route.status,
            route_name: activeSchedule.Route.route_name,
            start_datetime: activeSchedule.start_datetime,
            end_datetime: activeSchedule.end_datetime,
          };
        }
      }

      enhancedData.push({
        ...leave.toJSON(),
        driver_details: driver || null,
        current_assignment: assignmentInfo,
      });
    }

    res.json({
      success: true,
      total_records: count,
      total_pages: Math.ceil(count / limit),
      current_page: page,
      data: enhancedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getDriverAttendanceToday = async (req, res) => {
  try {
    const inputDate = req.body.date ? new Date(req.body.date) : new Date();
    const startDate = new Date(inputDate);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(inputDate);
    endDate.setHours(23, 59, 59, 999);

    const totalDrivers = await Driver.count();

    const driversOnLeave = await LeaveRequest.count({
      where: {
        status: LEAVE_STATUS.APPROVED,
        from_date: { [Op.lte]: endDate },
        to_date: { [Op.gte]: startDate },
      },
      distinct: true,
      col: "user_id",
    });

    const presentDrivers = totalDrivers - driversOnLeave;

    res.json({
      success: true,
      date: startDate.toLocaleDateString("en-CA"),
      total_drivers: totalDrivers,
      present_drivers: presentDrivers,
      drivers_on_leave: driversOnLeave,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

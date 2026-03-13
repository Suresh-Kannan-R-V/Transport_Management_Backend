const { Op } = require("sequelize");
const {
  Driver,
  User,
  LeaveRequest,
  Schedule,
  Route,
  RouteStop,
  Vehicle,
  sequelize,
} = require("../models");

exports.updateDriver = async (req, res) => {
  try {
    const { id } = req.params;

    await Driver.update(
      {
        ...req.body,
        updated_by: req.user.id,
      },
      { where: { id } },
    );

    res.json({ msg: "Driver updated successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Update failed" });
  }
};

exports.deleteDriver = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;

    if (!id) {
      throw new Error("Driver ID is required");
    }

    const driver = await Driver.findOne({
      where: { user_id: id },
      transaction: t,
    });

    if (!driver) {
      throw new Error("Driver not found");
    }

    await User.destroy({
      where: { id },
      transaction: t,
    });

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Driver deleted successfully",
    });
  } catch (error) {
    await t.rollback();
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllDrivers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100,
      search = "",
      status,
      isLogin,
      push_notification_status,
    } = req.query;

    const offset = (page - 1) * limit;
    const driverWhere = {};
    if (status) {
      driverWhere.status = status;
    }

    const userWhere = {};

    if (search) {
      userWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { user_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
      ];
    }

    if (isLogin !== undefined) {
      userWhere.isLogin = isLogin === "true";
    }

    if (push_notification_status !== undefined) {
      userWhere.push_notification_status = push_notification_status === "true";
    }

    const { count, rows } = await Driver.findAndCountAll({
      where: driverWhere,
      attributes: [
        "id",
        "license_number",
        "license_expiry",
        "experience_years",
        "blood_group",
        "total_kilometer_drived",
        "total_routes",
        "salary",
        "status",
        "created_at",
        "updated_at",
      ],
      include: [
        {
          model: User,
          attributes: [
            "id",
            "name",
            "user_name",
            "email",
            "phone",
            "isLogin",
            "push_notification_status",
          ],
          where: userWhere,
          required: true,
        },
      ],
      order: [["id", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const formatted = rows.map((d) => ({
      id: d.id,
      user_id: d.User.id,
      name: d.User.name,
      user_name: d.User.user_name,
      email: d.User.email,
      phone: d.User.phone,
      isLogin: d.User.isLogin,
      push_notification_status: d.User.push_notification_status,
      license_number: d.license_number,
      license_expiry: d.license_expiry,
      experience_years: d.experience_years,
      blood_group: d.blood_group,
      total_kilometer_drive: d.total_kilometer_drived,
      total_routes: d.total_routes,
      salary: d.salary,
      status: d.status,
      created_at: d.created_at,
      updated_at: d.updated_at,
    }));

    return res.status(200).json({
      success: true,
      total_records: count,
      total_pages: Math.ceil(count / limit),
      current_page: parseInt(page),
      data: formatted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch driver details",
      error: error.message,
    });
  }
};

exports.getDriverDashboard = async (req, res) => {
  try {
    const driverId = req.params.driverId;
    const today = new Date();

    /* DRIVER BASIC DETAILS */
    const driver = await Driver.findOne({
      where: { id: driverId },
      include: [
        {
          model: User,
          attributes: ["name", "email", "phone"],
        },
      ],
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    /* LEAVE COUNT */
    const leaveCount = await LeaveRequest.count({
      where: {
        user_id: driver.user_id,
        status: 2,
      },
    });

    /* ONGOING SCHEDULE */
    const ongoingSchedule = await Schedule.findOne({
      where: {
        driver_id: driverId,
        start_datetime: { [Op.lte]: today },
        end_datetime: { [Op.gte]: today },
      },
      include: [
        {
          model: Vehicle,
          attributes: ["vehicle_number"],
        },
        {
          model: Route,
          attributes: [
            "id",
            "route_name",
            "travel_type",
            "approx_distance_km",
            "start_datetime",
            "end_datetime",
            "created_by",
          ],
          include: [
            {
              model: RouteStop,
              attributes: ["stop_name", "stop_order"],
              separate: true,
              order: [["stop_order", "ASC"]],
            },
            {
              model: User,
              as: "creator",
              attributes: ["phone"],
            },
          ],
        },
      ],
    });

    /* UPCOMING ROUTES */
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const upcomingSchedules = await Schedule.findAll({
      where: {
        driver_id: driverId,
        start_datetime: { [Op.gt]: todayEnd },
      },
      include: [
        {
          model: Route,
          attributes: [
            "id",
            "route_name",
            "travel_type",
            "approx_distance_km",
            "approx_duration_minutes",
            "start_datetime",
            "end_datetime",
          ],
          include: [
            {
              model: RouteStop,
              attributes: ["stop_name", "stop_order"],
              separate: true,
              order: [["stop_order", "ASC"]],
            },
          ],
        },
      ],
      order: [["start_datetime", "ASC"]],
      limit: 5,
    });

    /* DRIVER DATA FORMAT */
    const driverData = {
      name: driver.User?.name || "",
      email: driver.User?.email || "",
      phone: driver.User?.phone || "",
      license: driver.license_number,
      licenseExpiry: driver.license_expiry,
      bloodGroup: driver.blood_group,
      totalKm: driver.total_kilometer_drived,
      totalLeaves: leaveCount,
      totalRoutes: driver.total_routes,
      expYears: driver.experience_years,
      status:driver.status,
    };

    /* ONGOING TASK FORMAT */
    let ongoingTask = null;

    if (ongoingSchedule) {
      const route = ongoingSchedule.Route;
      const stops =
        route.RouteStops?.sort((a, b) => a.stop_order - b.stop_order) || [];

      ongoingTask = {
        routeID: route.id,
        routeName: route.route_name,
        travelType: route.travel_type,
        vehicleNumber: ongoingSchedule.Vehicle?.vehicle_number || null,
        guestCount: route.passenger_count || 0,
        duration: route.approx_duration_minutes || 0,
        intermediateStops: stops.length > 2 ? stops.slice(1, -1).length : 0,
        startLocation: stops[0]?.stop_name || null,
        endLocation: stops[stops.length - 1]?.stop_name || null,
        startDate: ongoingSchedule.start_datetime,
        endDate: ongoingSchedule.end_datetime,
        creatorPhone: route.creator?.phone || null,
        status: ongoingSchedule.status,
      };
    }

    /* UPCOMING ROUTES FORMAT */
    const upcomingRoutes = upcomingSchedules.map((schedule) => {
      const route = schedule.Route;
      const stops =
        route.RouteStops?.sort((a, b) => a.stop_order - b.stop_order) || [];

      return {
        id: route.id,
        routeName: route.route_name,
        travelType: route.travel_type,
        startLocation: stops[0]?.stop_name || null,
        destinationLocation: stops[stops.length - 1]?.stop_name || null,
        distance: route.approx_distance_km,
        startDate: schedule.start_datetime,
        endDate: schedule.end_datetime,
      };
    });

    res.json({
      success: true,
      driverData,
      ongoingTask,
      upcomingRoutes,
    });
  } catch (error) {
    console.error("Driver Dashboard Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getDriverWeeklyKm = async (req, res) => {
  try {
    const driverId = req.params.driverId;
    const week_start_date = req.query.week_start_date;

    if (!week_start_date) {
      return res.status(400).json({
        success: false,
        message: "week_start_date is required",
      });
    }

    const startDate = new Date(week_start_date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    const schedules = await Schedule.findAll({
      where: {
        driver_id: driverId,
        start_datetime: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        {
          model: Route,
          attributes: ["approx_distance_km"],
        },
      ],
    });

    const weekMap = {
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
      Sun: 0,
    };

    schedules.forEach((schedule) => {
      const day = new Date(schedule.start_datetime).toLocaleDateString(
        "en-US",
        {
          weekday: "short",
        },
      );

      if (weekMap[day] !== undefined) {
        weekMap[day] += schedule.Route?.approx_distance_km || 0;
      }
    });

    const weekData = Object.keys(weekMap).map((day) => ({
      day,
      km: weekMap[day],
    }));

    res.json({
      success: true,
      week_start: startDate.toISOString().split("T")[0],
      week_end: endDate.toISOString().split("T")[0],
      weekData,
    });
  } catch (error) {
    console.error("Weekly KM Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

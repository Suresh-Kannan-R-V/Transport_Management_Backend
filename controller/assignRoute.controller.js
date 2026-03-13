const XLSX = require("xlsx");
const {
  Route,
  Role,
  LeaveRequest,
  Notification,
  UsageHistory,
  VehicleMaintenance,
  RouteStop,
  Booking,
  AuditLog,
  Schedule,
  Vehicle,
  Driver,
  User,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");
const { ROUTE_STATUS, DRIVER_STATUS } = require("../utils/helper");

//Admin Assign the vehicles
exports.assignVehicles = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { route_id, allocations, faculty_remark, admin_remark } = req.body;

    if (!route_id || !Array.isArray(allocations) || allocations.length === 0) {
      throw new Error("route_id and allocations are required");
    }

    const route = await Route.findByPk(route_id, {
      include: [{ model: Booking }],
      transaction: t,
    });

    if (!route) throw new Error("Route not found");
    if (!route.Bookings.length) throw new Error("No bookings found");

    // 🔹 Save remarks if provided
    await route.update(
      {
        faculty_remark: faculty_remark ?? route.faculty_remark,
        admin_remark: admin_remark ?? route.admin_remark,
        status: ROUTE_STATUS.VEHICLE_ASSIGNED,
        updated_at: new Date(),
      },
      { transaction: t },
    );

    const totalGuests = route.Bookings.length;
    const assignedGuestIds = allocations.flatMap((a) => a.guest_ids);

    if (new Set(assignedGuestIds).size !== assignedGuestIds.length)
      throw new Error("Duplicate guest assignment detected");

    if (assignedGuestIds.length !== totalGuests)
      throw new Error("All guests must be assigned");

    const vehicleIds = allocations.map((a) => a.vehicle_id);

    for (const allocation of allocations) {
      const { vehicle_id, guest_ids } = allocation;

      let schedule = await Schedule.create(
        {
          route_id,
          vehicle_id,
          driver_id: null,
          allocated_passenger_count: guest_ids.length,
          start_datetime: route.start_datetime,
          end_datetime: route.end_datetime || route.start_datetime,
          status: ROUTE_STATUS.VEHICLE_ASSIGNED,
          approved_by: req.user.id,
          approved_at: new Date(),
        },
        { transaction: t },
      );

      await Booking.update(
        { schedule_id: schedule.id },
        { where: { id: guest_ids }, transaction: t },
      );
    }

    // 🔥 Mark vehicles as assigned
    await Vehicle.update(
      { status: "assigned" },
      { where: { id: vehicleIds }, transaction: t },
    );

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Vehicle allocation created successfully",
    });
  } catch (error) {
    await t.rollback();
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//Admin Updating the Vehicle Assign already exist.
exports.updateAssignedVehicles = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { route_id, allocations, remarks } = req.body;

    if (!route_id || !Array.isArray(allocations) || allocations.length === 0) {
      throw new Error("route_id and allocations are required");
    }

    const route = await Route.findByPk(route_id, {
      include: [{ model: Booking }],
      transaction: t,
    });

    if (!route) throw new Error("Route not found");
    if (!route.Bookings.length) throw new Error("No bookings found");

    let updatedStatus;

    if (
      route.status === ROUTE_STATUS.VEHICLE_ASSIGNED ||
      route.status === ROUTE_STATUS.VEHICLE_REASSIGNED
    ) {
      updatedStatus =
        req.user.role === "Faculty"
          ? ROUTE_STATUS.FACULTY_APPROVED
          : ROUTE_STATUS.VEHICLE_REASSIGNED;
    } else {
      updatedStatus = ROUTE_STATUS.VEHICLE_ASSIGNED;
    }

    const updateData = {
      status: updatedStatus,
      updated_at: new Date(),
    };

    if (remarks) {
      if (req.user.role === "Faculty") {
        updateData.faculty_remark = remarks;
      } else if (req.user.role === "Transport Admin") {
        updateData.admin_remark = remarks;
      }
    }
    await route.update(updateData, { transaction: t });

    const totalGuests = route.Bookings.length;
    const assignedGuestIds = allocations.flatMap((a) => a.guest_ids);

    if (new Set(assignedGuestIds).size !== assignedGuestIds.length)
      throw new Error("Duplicate guest assignment detected");

    if (assignedGuestIds.length !== totalGuests)
      throw new Error("All guests must be assigned");

    const existingSchedules = await Schedule.findAll({
      where: { route_id },
      transaction: t,
    });

    if (!existingSchedules.length) throw new Error("No vehicles assigned yet.");

    const existingVehicleIds = existingSchedules.map((s) => s.vehicle_id);
    const incomingVehicleIds = allocations.map((a) => a.vehicle_id);

    const removedVehicleIds = existingVehicleIds.filter(
      (id) => !incomingVehicleIds.includes(id),
    );

    if (removedVehicleIds.length) {
      await Vehicle.update(
        { status: "active" },
        { where: { id: removedVehicleIds }, transaction: t },
      );
    }

    for (const schedule of existingSchedules) {
      if (!incomingVehicleIds.includes(schedule.vehicle_id)) {
        await Booking.update(
          { schedule_id: null },
          { where: { schedule_id: schedule.id }, transaction: t },
        );

        await Schedule.destroy({
          where: { id: schedule.id },
          transaction: t,
        });
      }
    }

    for (const allocation of allocations) {
      const { vehicle_id, guest_ids } = allocation;

      let schedule = existingSchedules.find((s) => s.vehicle_id === vehicle_id);

      if (schedule) {
        await schedule.update(
          {
            allocated_passenger_count: guest_ids.length,
            approved_by: req.user.id,
            approved_at: new Date(),
          },
          { transaction: t },
        );
      } else {
        schedule = await Schedule.create(
          {
            route_id,
            vehicle_id,
            driver_id: null,
            allocated_passenger_count: guest_ids.length,
            start_datetime: route.start_datetime,
            end_datetime: route.end_datetime || route.start_datetime,
            status: "Vehicle Assigned",
            approved_by: req.user.id,
            approved_at: new Date(),
          },
          { transaction: t },
        );
      }

      await Booking.update(
        { schedule_id: schedule.id },
        { where: { id: guest_ids }, transaction: t },
      );
    }

    await Vehicle.update(
      { status: "assigned" },
      { where: { id: incomingVehicleIds }, transaction: t },
    );

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Vehicle allocation updated successfully",
    });
  } catch (error) {
    await t.rollback();
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Admin Assign the driver
exports.assignDriver = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { schedule_id, driver_id } = req.body;

    if (!schedule_id || !driver_id) {
      throw new Error("schedule_id and driver_id are required");
    }

    const schedule = await Schedule.findByPk(schedule_id, { transaction: t });
    if (!schedule) throw new Error("Schedule not found");

    const routeId = schedule.route_id;

    const driver = await Driver.findByPk(driver_id, { transaction: t });
    if (!driver) throw new Error("Driver not found");

    if (driver.status !== DRIVER_STATUS.AVAILABLE) {
      throw new Error("Driver is not available");
    }

    await schedule.update(
      {
        driver_id,
        status: "Driver Assigned",
      },
      { transaction: t },
    );

    await driver.update({ status: DRIVER_STATUS.ASSIGNED }, { transaction: t });

    const totalSchedules = await Schedule.count({
      where: { route_id: routeId },
      transaction: t,
    });

    const assignedSchedules = await Schedule.count({
      where: {
        route_id: routeId,
        driver_id: { [Op.ne]: null },
      },
      transaction: t,
    });

    if (totalSchedules === assignedSchedules) {
      await Route.update(
        {
          status: ROUTE_STATUS.DRIVER_ASSIGNED,
          updated_at: new Date(),
        },
        { where: { id: routeId }, transaction: t },
      );
    }

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Driver assigned successfully",
    });
  } catch (error) {
    await t.rollback();
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateDriverAssign = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { schedule_id, new_driver_id } = req.body;

    if (!schedule_id || !new_driver_id) {
      throw new Error("schedule_id and new_driver_id are required");
    }

    const schedule = await Schedule.findByPk(schedule_id, { transaction: t });
    if (!schedule) throw new Error("Schedule not found");

    if (!schedule.driver_id) {
      throw new Error("No driver assigned to this schedule");
    }

    const routeId = schedule.route_id;
    const oldDriverId = schedule.driver_id;

    if (oldDriverId === new_driver_id) {
      throw new Error("Driver is already assigned to this schedule");
    }

    const newDriver = await Driver.findByPk(new_driver_id, { transaction: t });
    if (!newDriver) throw new Error("New driver not found");

    if (newDriver.status !== DRIVER_STATUS.AVAILABLE) {
      throw new Error("New driver is not available");
    }

    await Driver.update(
      { status: DRIVER_STATUS.AVAILABLE },
      { where: { id: oldDriverId }, transaction: t },
    );

    await schedule.update(
      {
        driver_id: new_driver_id,
        status: "Driver Reassigned",
      },
      { transaction: t },
    );

    await newDriver.update(
      { status: DRIVER_STATUS.ASSIGNED },
      { transaction: t },
    );

    await Route.update(
      { status: ROUTE_STATUS.DRIVER_REASSIGNED, updated_at: new Date() },
      { where: { id: routeId }, transaction: t },
    );

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Driver reassigned successfully",
    });
  } catch (error) {
    await t.rollback();
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//Admin changes the status of the route
exports.changeRouteStatus = async (req, res) => {
  try {
    const { route_id, status, remark } = req.body;

    if (!route_id || !status) {
      throw new Error("route_id and status required");
    }

    const allowedStatuses = Object.values(ROUTE_STATUS);

    if (!allowedStatuses.includes(Number(status))) {
      throw new Error("Invalid status");
    }

    const route = await Route.findByPk(route_id);
    if (!route) throw new Error("Route not found");

    const updateData = {
      status: Number(status),
      updated_at: new Date(),
    };

    if (remark) {
      if (req.user.role === "Faculty") {
        updateData.faculty_remark = remark;
      } else if (req.user.role === "Transport Admin") {
        updateData.admin_remark = remark;
      }
    }

    await route.update(updateData);

    return res.status(200).json({
      success: true,
      message: `Route status updated to ${status}`,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

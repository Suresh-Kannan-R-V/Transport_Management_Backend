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
const { Op, fn, col, literal } = require("sequelize");

exports.createTransportRequest = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    let {
      travel_info,
      route_details,
      vehicle_config,
      guests,
      additional_info,
    } = req.body;

    if (req.file) {
      travel_info = JSON.parse(travel_info);
      route_details = JSON.parse(route_details);
      vehicle_config = JSON.parse(vehicle_config);
      additional_info = additional_info ? JSON.parse(additional_info) : null;
    }

    const userId = req.user.id;

    if (!travel_info?.type || !travel_info?.start_date) {
      throw new Error("Travel type and start date are required");
    }
    const travelType = travel_info.type?.toLowerCase().trim();

    if (travelType === "multi day") {
      if (!travel_info.end_date) {
        throw new Error("End date is required for multi day travel");
      }
    } else {
      travel_info.end_date = null;
    }

    if (
      !route_details?.selected_locations ||
      route_details.selected_locations.length < 2
    ) {
      throw new Error("Minimum 2 locations required (start and destination)");
    }

    const startLocation = route_details.selected_locations[0];

    const destinationLocation =
      route_details.selected_locations[
        route_details.selected_locations.length - 1
      ];

    let processedGuests = [];

    if (req.file) {
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (!rows.length) {
        throw new Error("Uploaded file is empty");
      }

      rows.forEach((row, index) => {
        const rowNumber = index + 2;

        if (!row.name || !row.phone || !row.country_code) {
          throw new Error(
            `Row ${rowNumber}: name, phone and country_code required`,
          );
        }

        processedGuests.push({
          name: row.name,
          phone: row.phone,
          country_code: row.country_code,
        });
      });
    } else {
      if (!guests || !Array.isArray(guests) || !guests.length) {
        throw new Error("Guest list is required");
      }

      processedGuests = guests.map((g, index) => ({
        name: g.name,
        phone: g.phone,
        country_code: g.country_code,
      }));
    }

    const passengerCount = Number(vehicle_config.passenger_count);

    if (!passengerCount || passengerCount <= 0) {
      throw new Error("Invalid passenger count");
    }

    if (passengerCount === 1) {
      if (!processedGuests[0].name || !processedGuests[0].phone) {
        throw new Error("Name and phone required for single passenger");
      }
    }

    if (passengerCount === 2) {
      processedGuests.forEach((g, i) => {
        if (!g.name || !g.phone) {
          throw new Error(`Passenger ${i + 1}: name and phone required`);
        }
      });
    }

    if (passengerCount > 2) {
      for (let i = 0; i < 2; i++) {
        if (!processedGuests[i].name || !processedGuests[i].phone) {
          throw new Error("At least 2 passengers must have name and phone");
        }
      }
    }

    const phones = processedGuests.filter((g) => g.phone).map((g) => g.phone);

    if (phones.length !== new Set(phones).size) {
      throw new Error("Duplicate phone numbers found");
    }

    if (processedGuests.length > passengerCount) {
      throw new Error("Guest count exceeds passenger count");
    }

    if (processedGuests.length < passengerCount) {
      const currentCount = processedGuests.length;

      for (let i = currentCount; i < passengerCount; i++) {
        processedGuests.push({
          name: `Guest ${i + 1}`,
          phone: -1,
          country_code: null,
        });
      }
    }

    const route = await Route.create(
      {
        route_name: travel_info.route_name,
        created_by: userId,
        travel_type: travel_info.type,
        start_datetime: travel_info.start_date,
        end_datetime: travelType === "multi day" ? travel_info.end_date : null,
        approx_distance_km: route_details.distance_km,
        approx_duration_minutes: route_details.duration_mins,
        passenger_count: passengerCount,
        description: additional_info?.special_requirements || null,
        luggage_details: additional_info?.luggage_details || null,
        status: "pending",
      },
      { transaction: t },
    );

    const stops = route_details.selected_locations.map((location, index) => ({
      route_id: route.id,
      stop_name: location,
      stop_order: index + 1,
    }));

    await RouteStop.bulkCreate(stops, { transaction: t });

    const schedule = await Schedule.create(
      {
        route_id: route.id,
        vehicle_id: null, // IMPORTANT
        driver_id: null,
        allocated_passenger_count: passengerCount,
        start_datetime: travel_info.start_date,
        end_datetime: travel_info.end_date || travel_info.start_date,
        status: "pending",
      },
      { transaction: t },
    );

    const bookingData = processedGuests.map((g, index) => ({
      route_id: route.id,
      schedule_id: schedule.id,
      seat_number: index + 1,
      guest_name: g.name || null,
      guest_phone: g.phone || null,
      country_code: g.country_code || null,
      is_primary: index === 0,
      booking_status: "active",
    }));

    await Booking.bulkCreate(bookingData, { transaction: t });

    await t.commit();

    return res.status(201).json({
      success: true,
      message: "Transport request created successfully",
      route_id: route.id,
    });
  } catch (error) {
    await t.rollback();

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//Faculty Cancel the request
exports.cancelTransportRequest = async (req, res) => {
  try {
    const { route_id } = req.params;

    const route = await Route.findByPk(route_id);

    if (!route) throw new Error("Route not found");

    if (route.status !== "pending") {
      throw new Error("Cannot cancel after vehicle assignment");
    }

    await route.update({
      status: "cancelled",
      faculty_remark: "Cancelled by faculty",
    });

    return res.status(200).json({
      success: true,
      message: "Transport request cancelled",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.uncancelTransportRequest = async (req, res) => {
  try {
    const { route_id } = req.params;

    const route = await Route.findByPk(route_id);

    if (!route) {
      throw new Error("Route not found");
    }

    // Only allow if currently cancelled
    if (route.status !== "cancelled") {
      throw new Error("Only cancelled requests can be restored");
    }

    await route.update({
      status: "pending",
      faculty_remark: null,
    });

    return res.status(200).json({
      success: true,
      message: "Transport request restored successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteTransportRequest = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { route_id } = req.params;

    const route = await Route.findByPk(route_id, {
      include: [
        {
          model: Schedule,
        },
      ],
      transaction: t,
    });

    if (!route) {
      throw new Error("Route not found");
    }

    if (req.user.role === "Faculty" && route.status !== "pending") {
      throw new Error("Faculty can delete only pending requests");
    }

    const schedules = await Schedule.findAll({
      where: { route_id },
      transaction: t,
    });

    const scheduleIds = schedules.map((s) => s.id);

    await Booking.destroy({
      where: { route_id },
      transaction: t,
    });

    await UsageHistory.destroy({
      where: { schedule_id: scheduleIds },
      transaction: t,
    });

    await LeaveRequest.destroy({
      where: { schedule_id: scheduleIds },
      transaction: t,
    });

    await Schedule.destroy({
      where: { route_id },
      transaction: t,
    });

    await RouteStop.destroy({
      where: { route_id },
      transaction: t,
    });

    await AuditLog.destroy({
      where: {
        entity_id: route_id,
        entity: "route",
      },
      transaction: t,
    });

    await Route.destroy({
      where: { id: route_id },
      transaction: t,
    });

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Transport request deleted permanently",
    });
  } catch (error) {
    await t.rollback();

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//Get All Request Data
exports.getAllRoutes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const search = req.query.search?.trim() || "";
    const status = req.query.status;
    const travelType = req.query.travel_type;

    const sortBy = req.query.sortBy || "created_at";
    const sortOrder = req.query.sortOrder || "DESC";

    let whereCondition = {};

    if (status && status !== "") {
      whereCondition.status = status;
    }

    if (travelType && travelType !== "") {
      whereCondition.travel_type = travelType;
    }

    if (search) {
      whereCondition.route_name = {
        [Op.like]: `%${search}%`,
      };
    }

    let orderClause = [[sortBy, sortOrder]];

    const { rows, count } = await Route.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "faculty_id"],
          include: [{ model: Role, attributes: ["id", "name"] }],
        },
        {
          model: RouteStop,
          attributes: ["stop_name", "stop_order"],
        },
        {
          model: Schedule,
          attributes: ["id"],
          include: [
            {
              model: Vehicle,
              attributes: ["vehicle_number"],
            },
            {
              model: Driver,
              include: [
                {
                  model: User,
                  attributes: ["name"],
                },
              ],
            },
          ],
        },
      ],
      limit,
      offset,
      distinct: true,
      order: orderClause, // ✅ FIXED
    });

    const formatted = rows.map((route) => {
      const schedules = route.Schedules || [];

      let vehicleAssigned = null;
      if (schedules.length === 1 && schedules[0].Vehicle) {
        vehicleAssigned = schedules[0].Vehicle.vehicle_number;
      } else if (schedules.length > 1) {
        vehicleAssigned = schedules.length;
      }

      const drivers = schedules.filter((s) => s.Driver);
      let driverAssigned = null;

      if (drivers.length === 1) {
        driverAssigned = drivers[0].Driver.User.name;
      } else if (drivers.length > 1) {
        driverAssigned = drivers.length;
      }

      const sortedStops =
        route.RouteStops?.sort((a, b) => a.stop_order - b.stop_order) || [];

      return {
        id: route.id,
        routeName: route.route_name,
        createdBy: {
          user_id: route.creator?.id,
          name: route.creator?.name,
          faculty_id: route.creator?.faculty_id,
          roles: {
            id: route.creator?.Role?.id || null,
            role: route.creator?.Role?.name || null,
          },
        },
        status: route.status,
        travelType: route.travel_type,
        start_datetime: route.start_datetime,
        end_datetime: route.end_datetime,
        approx_duration: route.approx_duration_minutes,
        passengerCount: route.passenger_count,
        startLocation: sortedStops[0]?.stop_name || null,
        destinationLocation:
          sortedStops[sortedStops.length - 1]?.stop_name || null,
        intermediateStops:
          sortedStops.length > 2
            ? sortedStops.slice(1, -1).map((s) => s.stop_name)
            : [],
        vehicleAssigned,
        driverAssigned,
        createdAt: route.created_at,
      };
    });

    return res.status(200).json({
      success: true,
      totalItems: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      items: formatted,
    });
  } catch (error) {
    console.error("Get All Routes Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch routes",
    });
  }
};

exports.getRouteById = async (req, res) => {
  try {
    const routeId = req.params.route_id;

    if (!routeId) {
      return res.status(400).json({
        success: false,
        message: "Route ID is required",
      });
    }

    const route = await Route.findOne({
      where: { id: routeId },
      include: [
        {
          model: User,
          as: "creator",
          attributes: [
            "id",
            "name",
            "user_name",
            "email",
            "phone",
            "faculty_id",
            "destination",
            "department",
          ],
          include: [
            {
              model: Role,
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: RouteStop,
          attributes: ["stop_name", "stop_order"],
        },
        {
          model: Schedule,
          attributes: [
            "id",
            "allocated_passenger_count",
            "status",
            "approved_at",
            "start_datetime",
            "end_datetime",
          ],
          include: [
            {
              model: Vehicle,
              attributes: ["id", "vehicle_number", "vehicle_type"],
            },
            {
              model: Driver,
              attributes: ["id"],
              include: [
                {
                  model: User,
                  attributes: ["name", "phone"],
                },
              ],
            },
            {
              model: Booking,
              attributes: [
                "id",
                "guest_name",
                "country_code",
                "guest_phone",
                "seat_number",
                "booking_status",
              ],
            },
            {
              model: User,
              as: "approver",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
    });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    // ---------- SORT STOPS ----------
    const sortedStops =
      route.RouteStops?.sort((a, b) => a.stop_order - b.stop_order) || [];

    const selectedLocations = sortedStops.map((s) => s.stop_name);

    // ---------- FORMAT SCHEDULES ----------
    const schedules = route.Schedules.map((schedule) => {
      return {
        schedule_id: schedule.id,
        status: schedule.status,
        start_datetime: schedule.start_datetime,
        end_datetime: schedule.end_datetime,

        vehicle: schedule.Vehicle
          ? {
              id: schedule.Vehicle.id,
              vehicle_number: schedule.Vehicle.vehicle_number,
              vehicle_type: schedule.Vehicle.vehicle_type,
              assigned_at: schedule.approved_at,
              assigned_by: schedule.approver?.name || null,
            }
          : null,

        driver: schedule.Driver
          ? {
              id: schedule.Driver.id,
              name: schedule.Driver.User?.name,
              phone: schedule.Driver.User?.phone,
            }
          : null,

        guest_count: schedule.Bookings.length,

        guests: schedule.Bookings?.sort(
          (a, b) => a.seat_number - b.seat_number,
        ).map((guest) => ({
          id: guest.id,
          name: guest.guest_name,
          phone: `${guest.country_code} ${guest.guest_phone}`,
          seat_number: guest.seat_number,
          status: guest.booking_status,
        })),
      };
    });

    const allGuests =
      route.Schedules?.flatMap((schedule) => schedule.Bookings)
        ?.sort((a, b) => a.seat_number - b.seat_number)
        ?.map((guest) => ({
          id: guest.id,
          name: guest.guest_name,
          phone:
            `${guest.country_code || "null"} ${guest.guest_phone || ""}`.trim(),
          seat_number: guest.seat_number,
          status: guest.booking_status,
        })) || [];

    // ---------- FINAL RESPONSE ----------
    const response = {
      travel_info: {
        route_name: route.route_name,
        type: route.travel_type,
        start_date: route.start_datetime,
        end_date: route.end_datetime,
      },

      route_details: {
        selected_locations: selectedLocations,
        distance_km: route.approx_distance_km,
        duration_mins: route.approx_duration_minutes,
      },

      vehicle_config: {
        passenger_count: route.passenger_count,
      },

      additional_info: {
        special_requirements: route.description,
        luggage_details: route.luggage_details,
      },
      total_guest: allGuests.length,
      guests: allGuests,
      route_status: route.status,
      faculty_remark: route.faculty_remark,
      admin_remark: route.admin_remark,
      created_at: route.created_at,

      creator: route.creator,

      schedules,
    };

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Get Route By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch route details",
    });
  }
};

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
        status: "Vehicle Assigned",
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
          status: "Vehicle Assigned",
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

    // 🔹 Update remarks if provided
    await route.update(
      {
        faculty_remark: faculty_remark ?? route.faculty_remark,
        admin_remark: admin_remark ?? route.admin_remark,
        status: "Vehicle Assigned",
      },
      { transaction: t },
    );

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

    // 🔥 Vehicles removed → set active
    const removedVehicleIds = existingVehicleIds.filter(
      (id) => !incomingVehicleIds.includes(id),
    );

    if (removedVehicleIds.length) {
      await Vehicle.update(
        { status: "active" },
        { where: { id: removedVehicleIds }, transaction: t },
      );
    }

    // 🔥 Remove deleted schedules
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

    // 🔥 Update/Create schedules
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

    // 🔥 Mark all incoming vehicles as assigned
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
  try {
    const { schedule_id, driver_id } = req.body;

    if (!schedule_id || !driver_id) {
      throw new Error("schedule_id and driver_id required");
    }

    const schedule = await Schedule.findByPk(schedule_id);

    if (!schedule) throw new Error("Schedule not found");

    await schedule.update({
      driver_id,
      status: "driver_assigned",
    });

    return res.status(200).json({
      success: true,
      message: "Driver assigned successfully",
    });
  } catch (error) {
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

    const allowedStatuses = [
      "Approved",
      "Rejected",
      "Vehicle Assigned",
      "Driver Assigned",
      "Completed",
      "Cancelled by Admin",
    ];

    if (!allowedStatuses.includes(status)) {
      throw new Error("Invalid status");
    }

    const route = await Route.findByPk(route_id);

    if (!route) throw new Error("Route not found");

    await route.update({
      status,
      admin_remark: remark || null,
    });

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

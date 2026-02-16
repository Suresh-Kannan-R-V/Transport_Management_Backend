const XLSX = require("xlsx");
const {
  Route,
  RouteStop,
  Booking,
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

    // If file upload, parse JSON fields
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

    if (
      travel_info.type.toLowerCase() === "multi days" ||
      travel_info.type.toLowerCase() === "multidays"
    ) {
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

    if (processedGuests.length !== passengerCount) {
      throw new Error("Passenger count does not match guest list");
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

    const phones = processedGuests.map((g) => g.phone);
    if (phones.length !== new Set(phones).size) {
      throw new Error("Duplicate phone numbers found");
    }

    const route = await Route.create(
      {
        route_name: travel_info.route_name,
        created_by: userId,
        travel_type: travel_info.type,
        start_datetime: travel_info.start_date,
        end_datetime: travel_info.end_date,
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
      status: "cancelled_by_faculty",
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

//Get All Request Data
exports.getAllRoutes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const search = req.query.search || "";
    const status = req.query.status;
    const travelType = req.query.travel_type;
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;

    let whereCondition = {};

    if (status) whereCondition.status = status;
    if (travelType) whereCondition.travel_type = travelType;

    if (startDate && endDate) {
      whereCondition.start_datetime = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const { rows, count } = await Route.findAndCountAll({
      where: whereCondition,

      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "faculty_id"],
          where: search
            ? {
                [Op.or]: [
                  { name: { [Op.like]: `%${search}%` } },
                  { faculty_id: { [Op.like]: `%${search}%` } },
                ],
              }
            : undefined,
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
      distinct: true, // IMPORTANT when using include
      order: [["created_at", "DESC"]],
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

      const startLocation =
        sortedStops.length > 0 ? sortedStops[0].stop_name : null;

      const destinationLocation =
        sortedStops.length > 1
          ? sortedStops[sortedStops.length - 1].stop_name
          : null;

      const intermediateStops =
        sortedStops.length > 2
          ? sortedStops.slice(1, -1).map((s) => s.stop_name)
          : [];

      return {
        id: route.id,
        routeName: route.route_name,
        createdBy: {
          user_id: route.creator?.id,
          name: route.creator?.name,
          faculty_id: route.creator?.faculty_id,
        },
        status: route.status,
        travelType: route.travel_type,
        start_datetime: route.start_datetime,
        end_datetime: route.end_datetime,
        passengerCount: route.passenger_count,
        startLocation,
        destinationLocation,
        intermediateStops,
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

//Admin Assign the vehicles
exports.assignVehicles = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { route_id, allocations } = req.body;

    if (!route_id || !allocations || !allocations.length) {
      throw new Error("route_id and allocations are required");
    }

    const route = await Route.findByPk(route_id, {
      include: [{ model: Booking }],
    });

    if (!route) throw new Error("Route not found");

    const totalGuests = route.bookings.length;

    const assignedGuestIds = allocations.flatMap((a) => a.guest_ids);

    // Duplicate check
    const unique = new Set(assignedGuestIds);
    if (unique.size !== assignedGuestIds.length) {
      throw new Error("Duplicate guest assignment detected");
    }

    // Ensure all guests assigned
    if (assignedGuestIds.length !== totalGuests) {
      throw new Error("All guests must be assigned");
    }

    // Create schedule per vehicle
    for (const allocation of allocations) {
      const { vehicle_id, guest_ids } = allocation;

      if (!vehicle_id || !guest_ids.length) {
        throw new Error("vehicle_id and guest_ids required");
      }

      const schedule = await Schedule.create(
        {
          route_id: route_id,
          vehicle_id,
          driver_id: null, // 🚨 driver assigned later
          allocated_passenger_count: guest_ids.length,
          start_datetime: route.start_datetime,
          end_datetime: route.end_datetime || route.start_datetime,
          status: "vehicle_assigned",
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

    await Route.update(
      { status: "vehicle_assigned" },
      { where: { id: route_id }, transaction: t },
    );

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Vehicle assigned successfully",
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
      "approved",
      "rejected",
      "vehicle_assigned",
      "driver_assigned",
      "completed",
      "cancelled_by_admin",
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

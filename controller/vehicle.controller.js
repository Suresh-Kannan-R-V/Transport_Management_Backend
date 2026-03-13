const XLSX = require("xlsx");
const { Op } = require("sequelize");
const { Vehicle, sequelize } = require("../models");

exports.createVehicle = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    let vehiclesData = [];

    if (req.file) {
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (!rows.length) throw new Error("Uploaded file is empty");

      vehiclesData = rows.map((row, index) => {
        if (
          !row.vehicle_number ||
          !row.vehicle_type ||
          !row.capacity ||
          row.current_kilometer == null ||
          !row.insurance_date ||
          !row.pollution_date ||
          !row.rc_date ||
          !row.fc_date
        ) {
          throw new Error(`Row ${index + 2} missing required fields`);
        }

        return {
          vehicle_number: row.vehicle_number.trim(),
          vehicle_type: row.vehicle_type.trim(),
          capacity: Number(row.capacity),
          status: row.status || "active",
          current_kilometer: Number(row.current_kilometer),
          total_kilometer_runs: Number(row.total_kilometer_runs) || 0,
          insurance_date: row.insurance_date,
          pollution_date: row.pollution_date,
          rc_date: row.rc_date,
          fc_date: row.fc_date,
          next_service_date: row.next_service_date || null,
        };
      });
    } else if (Array.isArray(req.body.vehicles)) {
      vehiclesData = req.body.vehicles.map((v, index) => {
        if (
          !v.vehicle_number ||
          !v.vehicle_type ||
          !v.capacity ||
          v.current_kilometer == null ||
          !v.insurance_date ||
          !v.pollution_date ||
          !v.rc_date ||
          !v.fc_date
        ) {
          throw new Error(`Vehicle at index ${index} missing required fields`);
        }

        return {
          vehicle_number: v.vehicle_number.trim(),
          vehicle_type: v.vehicle_type.trim(),
          capacity: Number(v.capacity),
          status: v.status || "active",
          current_kilometer: Number(v.current_kilometer),
          total_kilometer_runs: Number(v.total_kilometer_runs) || 0,
          insurance_date: v.insurance_date,
          pollution_date: v.pollution_date,
          rc_date: v.rc_date,
          fc_date: v.fc_date,
          next_service_date: v.next_service_date || null,
        };
      });
    } else {
      const {
        vehicle_number,
        vehicle_type,
        capacity,
        status,
        current_kilometer,
        total_kilometer_runs,
        insurance_date,
        pollution_date,
        rc_date,
        fc_date,
        next_service_date,
      } = req.body;

      if (
        !vehicle_number ||
        !vehicle_type ||
        !capacity ||
        current_kilometer == null ||
        !insurance_date ||
        !pollution_date ||
        !rc_date ||
        !fc_date
      ) {
        throw new Error("Required fields missing");
      }

      vehiclesData.push({
        vehicle_number: vehicle_number.trim(),
        vehicle_type: vehicle_type.trim(),
        capacity: Number(capacity),
        status: status || "active",
        current_kilometer: Number(current_kilometer),
        total_kilometer_runs: Number(total_kilometer_runs) || 0,
        insurance_date,
        pollution_date,
        rc_date,
        fc_date,
        next_service_date: next_service_date || null,
      });
    }

    const numbers = vehiclesData.map((v) => v.vehicle_number);
    const duplicateInRequest = numbers.filter(
      (item, index) => numbers.indexOf(item) !== index,
    );

    if (duplicateInRequest.length) {
      throw new Error("Duplicate vehicle numbers in request");
    }

    const existingVehicles = await Vehicle.findAll({
      where: {
        vehicle_number: {
          [Op.in]: numbers,
        },
      },
      transaction: t,
    });

    if (existingVehicles.length > 0) {
      const existingNumbers = existingVehicles.map((v) => v.vehicle_number);
      throw new Error(
        `Vehicle number(s) already exist: ${existingNumbers.join(", ")}`,
      );
    }

    const createdVehicles = await Vehicle.bulkCreate(vehiclesData, {
      transaction: t,
    });

    await t.commit();

    return res.status(201).json({
      success: true,
      message: "Vehicle(s) created successfully",
      count: createdVehicles.length,
      data: createdVehicles,
    });
  } catch (err) {
    await t.rollback();

    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteVehicle = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;

    if (!id) {
      throw new Error("Vehicle ID is required");
    }

    const vehicle = await Vehicle.findByPk(id, { transaction: t });

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    await vehicle.destroy({ transaction: t });

    await t.commit();

    return res.json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (err) {
    await t.rollback();
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getAllVehicles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      vehicle_type,
      capacity,
      sortBy = "capacity",
      order = "DESC",
    } = req.query;

    const offset = (page - 1) * limit;

    let whereCondition = {};

    if (search) {
      whereCondition[Op.or] = [
        { vehicle_number: { [Op.like]: `%${search}%` } },
        { vehicle_type: { [Op.like]: `%${search}%` } },
      ];
    }

    if (status) {
      whereCondition.status = status;
    }
    if (vehicle_type) {
      whereCondition.vehicle_type = vehicle_type;
    }
    if (capacity) {
      whereCondition.capacity = Number(capacity);
    }

    const { count, rows } = await Vehicle.findAndCountAll({
      where: whereCondition,
      limit: Number(limit),
      offset: offset,
      order: [[sortBy, order.toUpperCase()]],
    });

    return res.json({
      success: true,
      totalRecords: count,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

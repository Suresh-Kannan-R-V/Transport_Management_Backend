const XLSX = require("xlsx");
const { Op } = require("sequelize");
const { Vehicle, sequelize } = require("../models");

exports.createVehicle = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    let vehiclesData = [];

    // EXCEL
    if (req.file) {
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (!rows.length) throw new Error("Uploaded file is empty");

      vehiclesData = rows.map((row, index) => {
        if (!row.vehicle_number || !row.vehicle_type || !row.capacity) {
          throw new Error(`Row ${index + 2} missing required fields`);
        }

        return {
          vehicle_number: row.vehicle_number,
          vehicle_type: row.vehicle_type,
          capacity: Number(row.capacity),
          status: row.status || "active",
        };
      });
    }

    // JSON BULK
    else if (Array.isArray(req.body.vehicles)) {
      vehiclesData = req.body.vehicles.map((v, index) => {
        if (!v.vehicle_number || !v.vehicle_type || !v.capacity) {
          throw new Error(`Vehicle at index ${index} missing required fields`);
        }

        return {
          vehicle_number: v.vehicle_number,
          vehicle_type: v.vehicle_type,
          capacity: Number(v.capacity),
          status: v.status || "active",
        };
      });
    }

    // SINGLE
    else {
      const { vehicle_number, vehicle_type, capacity, status } = req.body;

      if (!vehicle_number || !vehicle_type || !capacity) {
        throw new Error("Required fields missing");
      }

      vehiclesData.push({
        vehicle_number,
        vehicle_type,
        capacity: Number(capacity),
        status: status || "active",
      });
    }

    const numbers = vehiclesData.map((v) => v.vehicle_number);

    const existing = await Vehicle.findAll({
      where: { vehicle_number: numbers },
      transaction: t,
    });

    if (existing.length > 0) {
      throw new Error("Some vehicle numbers already exist");
    }

    const created = await Vehicle.bulkCreate(vehiclesData, { transaction: t });

    await t.commit();

    res.status(201).json({
      success: true,
      message: "Vehicle(s) created successfully",
      count: created.length,
      data: created,
    });
  } catch (err) {
    await t.rollback();
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.bulkUpdateVehicles = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    let updateData = [];

    // EXCEL
    if (req.file) {
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (!rows.length) throw new Error("Uploaded file is empty");

      updateData = rows.map((row, index) => {
        if (!row.id) {
          throw new Error(`Row ${index + 2}: id is required for update`);
        }

        return {
          id: row.id,
          vehicle_number: row.vehicle_number,
          vehicle_type: row.vehicle_type,
          capacity: row.capacity ? Number(row.capacity) : undefined,
          status: row.status,
        };
      });
    }

    // JSON BULK
    else if (Array.isArray(req.body.vehicles)) {
      updateData = req.body.vehicles;

      updateData.forEach((v, index) => {
        if (!v.id) {
          throw new Error(`Vehicle at index ${index} missing id`);
        }
      });
    } else {
      throw new Error("Vehicles array or file required");
    }

    for (let vehicle of updateData) {
      const existing = await Vehicle.findByPk(vehicle.id, { transaction: t });

      if (!existing) {
        throw new Error(`Vehicle ID ${vehicle.id} not found`);
      }

      await existing.update(vehicle, { transaction: t });
    }

    await t.commit();

    res.json({
      success: true,
      message: "Vehicles updated successfully",
      count: updateData.length,
    });
  } catch (err) {
    await t.rollback();
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.bulkDeleteVehicles = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    let ids = [];

    // EXCEL
    if (req.file) {
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (!rows.length) throw new Error("Uploaded file is empty");

      ids = rows.map((row, index) => {
        if (!row.id) {
          throw new Error(`Row ${index + 2}: id required`);
        }
        return row.id;
      });
    }

    // JSON BULK
    else if (Array.isArray(req.body.ids)) {
      ids = req.body.ids;
    } else {
      throw new Error("IDs array or file required");
    }

    await Vehicle.destroy({
      where: { id: ids },
      transaction: t,
    });

    await t.commit();

    res.json({
      success: true,
      message: "Vehicles deleted successfully",
      count: ids.length,
    });
  } catch (err) {
    await t.rollback();
    res.status(400).json({ success: false, message: err.message });
  }
};


exports.getAllVehicles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
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

    const { count, rows } = await Vehicle.findAndCountAll({
      where: whereCondition,
      limit: Number(limit),
      offset: Number(offset),
      order: [[sortBy, order]],
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
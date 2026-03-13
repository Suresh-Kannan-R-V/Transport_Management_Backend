const XLSX = require("xlsx");
const { Route, Schedule, RouteOtp, Driver, sequelize } = require("../models");
const { Op } = require("sequelize");
const { ROUTE_STATUS, DRIVER_STATUS, generateOTP } = require("../utils/helper");

exports.generateStartOTP = async (req, res) => {
  try {
    const { route_id } = req.body;

    const route = await Route.findByPk(route_id);

    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    if (route.created_by !== req.user.id) {
      return res.status(403).json({ message: "Only creator can generate OTP" });
    }

    if (
      route.status !== ROUTE_STATUS.DRIVER_ASSIGNED &&
      route.status !== ROUTE_STATUS.DRIVER_REASSIGNED
    ) {
      return res.status(400).json({
        message: "Start OTP can be generated only when driver is assigned",
      });
    }

    const otp = generateOTP();

    const expires = new Date(Date.now() + 30 * 1000);

    await RouteOtp.create({
      route_id,
      otp_code: otp,
      otp_type: "START",
      created_by: req.user.id,
      expires_at: expires,
    });

    res.json({
      message: "Start OTP generated",
      otp,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.startRoute = async (req, res) => {
  try {
    const { route_id, otp } = req.body;

    const route = await Route.findByPk(route_id);

    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    if (
      route.status !== ROUTE_STATUS.DRIVER_ASSIGNED &&
      route.status !== ROUTE_STATUS.DRIVER_REASSIGNED
    ) {
      return res.status(400).json({
        message: "Route cannot be started at this stage",
      });
    }

    const otpData = await RouteOtp.findOne({
      where: {
        route_id,
        otp_code: otp,
        otp_type: "START",
        used: 0,
      },
    });

    if (!otpData) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date() > otpData.expires_at) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const schedule = await Schedule.findOne({
      where: { route_id },
    });

    const driver = await Driver.findByPk(schedule.driver_id);

    await Route.update(
      { status: ROUTE_STATUS.STARTED },
      { where: { id: route_id } },
    );

    await Driver.update(
      { status: DRIVER_STATUS.ON_TRIP },
      { where: { id: driver.id } },
    );

    otpData.used = 1;
    await otpData.save();

    res.json({
      message: "Route started successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.generateEndOTP = async (req, res) => {
  try {
    const { route_id } = req.body;

    const otp = generateOTP();

    const expires = new Date(Date.now() + 30 * 1000);

    await RouteOtp.create({
      route_id,
      otp_code: otp,
      otp_type: "END",
      created_by: req.user.id,
      expires_at: expires,
    });

    res.json({
      message: "End OTP generated",
      otp,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.completeRouteWithOTP = async (req, res) => {
  try {
    const { route_id, otp } = req.body;

    const otpData = await RouteOtp.findOne({
      where: {
        route_id,
        otp_code: otp,
        otp_type: "END",
        used: 0,
      },
    });

    if (!otpData) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date() > otpData.expires_at) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const schedule = await Schedule.findOne({
      where: { route_id },
    });

    await Route.update(
      { status: ROUTE_STATUS.COMPLETED },
      { where: { id: route_id } },
    );

    await Driver.update(
      { status: DRIVER_STATUS.AVAILABLE },
      { where: { id: schedule.driver_id } },
    );

    otpData.used = 1;
    await otpData.save();

    res.json({
      message: "Route completed successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.completeRouteDirect = async (req, res) => {
  try {
    const { route_id } = req.body;

    const schedule = await Schedule.findOne({
      where: { route_id },
    });

    await Route.update(
      { status: ROUTE_STATUS.COMPLETED },
      { where: { id: route_id } },
    );

    await Driver.update(
      { status: DRIVER_STATUS.AVAILABLE },
      { where: { id: schedule.driver_id } },
    );

    res.json({
      message: "Route completed by admin",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

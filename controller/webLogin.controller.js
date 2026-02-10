const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const { WebLoginSession, User, Role } = require("../models");
const { Op } = require("sequelize");

const MAX_WEB_HOURS = 24; // safety cap

// 1️⃣ Web creates QR session
// exports.createWebLoginSession = async (req, res) => {
//   try {
//     const session = await WebLoginSession.create({
//       id: randomUUID(),
//       status: "PENDING",
//       expires_at: new Date(Date.now() + 2 * 60 * 1000), // QR valid for 2 mins
//     });

//     return res.status(201).json({
//       sessionId: session.id,
//       expiresAt: session.expires_at,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to create session" });
//   }
// };

exports.createWebLoginSession = async (req, res) => {
  try {
    const now = new Date();

    // 🔹 1️⃣ Expire old pending sessions
    await WebLoginSession.update(
      { status: "EXPIRED" },
      {
        where: {
          status: "PENDING",
          expires_at: { [Op.lt]: now },
        },
      },
    );

    // 🔹 2️⃣ REUSE existing active PENDING session (🔥 FIX)
    const existingSession = await WebLoginSession.findOne({
      where: {
        status: "PENDING",
        expires_at: { [Op.gt]: now },
      },
      order: [["created_at", "DESC"]],
    });

    if (existingSession) {
      return res.status(200).json({
        sessionId: existingSession.id,
        expiresAt: existingSession.expires_at,
        reused: true,
      });
    }

    // 🔹 3️⃣ Rate limit (now safe, after reuse check)
    const recentPending = await WebLoginSession.count({
      where: {
        status: "PENDING",
        created_at: {
          [Op.gt]: new Date(now - 60 * 1000),
        },
      },
    });

    if (recentPending >= 5) {
      return res.status(429).json({
        message: "Too many QR requests. Please wait.",
      });
    }

    // 🔹 4️⃣ Create new QR session
    const session = await WebLoginSession.create({
      id: randomUUID(),
      status: "PENDING",
      expires_at: new Date(now.getTime() + 2 * 60 * 1000), // 2 minutes
    });

    return res.status(201).json({
      sessionId: session.id,
      expiresAt: session.expires_at,
      reused: false,
    });
  } catch (err) {
    console.error("createWebLoginSession error:", err);
    res.status(500).json({ message: "Failed to create session" });
  }
};

// 2️⃣ Mobile approves login + sets duration
exports.approveWebLogin = async (req, res) => {
  try {
    const { sessionId, accessHours } = req.body;
    const userId = req.user.id;

    if (!accessHours || accessHours <= 0) {
      return res.status(400).json({ message: "Invalid access duration" });
    }

    const hours = Math.min(accessHours, MAX_WEB_HOURS);

    const session = await WebLoginSession.findOne({
      where: { id: sessionId, status: "PENDING" },
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    if (session.expires_at < new Date()) {
      await session.update({ status: "EXPIRED" });
      return res.status(410).json({ message: "QR expired" });
    }

    if (session.status !== "PENDING") {
      return res.status(400).json({
        message: "Session already used or invalid",
      });
    }

    await session.update({
      user_id: userId,
      status: "APPROVED",
      web_access_expires_at: new Date(Date.now() + hours * 60 * 60 * 1000),
    });

    return res.json({
      message: `Web access approved for ${hours} hour(s)`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Approval failed" });
  }
};

// 3️⃣ Web polls status
exports.checkWebLoginSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await WebLoginSession.findByPk(sessionId, {
      include: {
        model: User,
        include: Role,
      },
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    const now = new Date();

    if (session.status === "PENDING" && session.expires_at < now) {
      await session.update({ status: "EXPIRED" });
      return res.status(410).json({ message: "QR expired" });
    }

    if (session.status === "PENDING") {
      return res.json({ status: "PENDING" });
    }

    if (session.status === "EXPIRED") {
      return res.status(410).json({ message: "Session expired" });
    }

    // APPROVED → issue token ONCE
    const user = session.User;

    const expiresInSeconds = Math.floor(
      (new Date(session.web_access_expires_at) - now) / 1000,
    );

    if (expiresInSeconds <= 0) {
      await session.update({ status: "EXPIRED" });
      return res.status(410).json({ message: "Web access expired" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.Role.name,
        sessionId,
        type: "WEB",
      },
      process.env.JWT_SECRET,
      { expiresIn: expiresInSeconds },
    );

    // ✅ STORE TOKEN
    await User.update({ token, isLogin: true }, { where: { id: user.id } });

    await session.update({ status: "EXPIRED" });

    return res.json({
      status: "APPROVED",
      token,
      expiresAt: session.web_access_expires_at,
      user: {
        id: user.id,
        email: user.email,
        role: user.Role.name,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Session check failed" });
  }
};
/**
 * GET USER DEVICES
 * ?type=active | history
 */
// const { Op } = require("sequelize");
// const { WebLoginSession } = require("../models");

exports.getUserDevices = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = "active" } = req.query;

    const now = new Date();

    const where = {
      user_id: userId,
      // only sessions that were approved at least once
      //   status: "APPROVED",
    };

    // 🟢 ACTIVE devices → web access still valid
    if (type === "active") {
      where.web_access_expires_at = {
        [Op.gt]: now,
      };
    }

    if (type === "history") {
      where[Op.or] = [
        { web_access_expires_at: { [Op.lte]: now } },
        { web_access_expires_at: null },
      ];
    }

    const sessions = await WebLoginSession.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    const formatted = sessions.map((s, index) => {
      const startAt = s.createdAt;
      const expiresAt = s.web_access_expires_at;

      const diffMs =
        expiresAt && startAt ? expiresAt.getTime() - startAt.getTime() : 0;

      const totalMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));

      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      return {
        id: s.id,
        deviceName: `Device ${index + 1}`,
        startAt,
        expiresAt,
        duration: `${hours}h ${minutes}m`,
        status: expiresAt > now ? "ACTIVE" : "EXPIRED",
      };
    });

    return res.json(formatted);
  } catch (err) {
    console.error("getUserDevices error:", err);
    return res.status(500).json({ message: "Failed to fetch devices" });
  }
};

/**
 * LOGOUT DEVICE
 */
exports.logoutDevice = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const session = await WebLoginSession.findOne({
      where: {
        id,
        user_id: userId,
      },
    });

    if (!session) {
      return res.status(404).json({ message: "Device not found" });
    }

    await session.update({
      status: "EXPIRED",
      expires_at: new Date(),
    });

    res.json({ message: "Device logged out successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Logout failed" });
  }
};

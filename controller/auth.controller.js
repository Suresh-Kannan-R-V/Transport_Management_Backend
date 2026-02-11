const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const { User, Role } = require("../models");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "ID Token missing" });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const email = payload.email;
    const domain = payload.hd; // bitsathy.ac.in

    if (domain !== "bitsathy.ac.in") {
      return res.status(403).json({ message: "Unauthorized domain" });
    }
    console.log(email, "email");
    console.log(domain, "domain");

    const user = await User.findOne({
      where: { email },
      include: [{ model: Role }],
    });

    if (!user) {
      return res.status(403).json({ message: "User not registered" });
    }

    // 4️⃣ Single login check
    if (user.isLogin === true) {
      return res.status(403).json({
        message: "User already logged in from another device",
      });
    }

    // 5️⃣ Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.Role.name,
      },
      process.env.JWT_SECRET,
    );

    // 6️⃣ Update DB
    await user.update({
      isLogin: true,
      token: token,
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.Role.name,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);
    return res.status(500).json({ message: "Google login failed" });
  }
};

exports.logoutUser = async (req, res) => {
  try {
    const userId = req.user.id;

    await User.update(
      {
        isLogin: false,
        token: null,
      },
      { where: { id: userId } },
    );

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};


exports.UserLoginCheck = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("TMS ")) {
      return res.status(401).json({
        message: "Authorization token missing",
        forceLogout: true,
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({
      where: {
        id: decoded.id,
        token,
        isLogin: true,
      },
      include: [{ model: Role }],
    });

    if (!user) {
      return res.status(401).json({
        message: "Session expired",
        forceLogout: true,
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid session",
      forceLogout: true,
    });
  }
};

exports.adminLogoutUser = async (req, res) => {
  try {
    const adminId = req.user.id;
    const adminRole = req.user.role;
    const { id } = req.params;

    if (Number(id) === Number(adminId)) {
      return res.status(400).json({
        success: false,
        message: "Admin cannot logout himself",
      });
    }

    const user = await User.findOne({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // If already logged out
    if (!user.isLogin) {
      return res.status(400).json({
        success: false,
        message: "User already logged out",
      });
    }

    await user.update({
      isLogin: false,
      token: null,
    });

    return res.status(200).json({
      success: true,
      message: "User logged out successfully by admin",
    });
  } catch (err) {
    console.error("Admin logout user error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to logout user",
    });
  }
};

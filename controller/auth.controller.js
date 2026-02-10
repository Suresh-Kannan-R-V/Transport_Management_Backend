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
    // user already attached by auth middleware
    const userId = req.user.id;

    const user = await User.findOne({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    await user.update({
      isLogin: false,
      token: null,
    });

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
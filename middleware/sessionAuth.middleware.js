const jwt = require("jsonwebtoken");
const { User } = require("../models");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("TMS ")) {
      return res.status(401).json({ msg: "Token missing" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({
      where: {
        id: decoded.id,
        isLogin: true,
      },
    });

    if (!user) {
      return res.status(401).json({ msg: "User logged out" });
    }

    req.user = decoded; // id, role, email, type
    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ msg: "Invalid or expired token" });
  }
};

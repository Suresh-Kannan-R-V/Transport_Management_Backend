const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Asky ")) {
      return res.status(401).json({
        msg: "Access denied. Token missing or invalid format"
      });
    }

    const token = authHeader.split(" ")[1];

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        msg: "JWT_SECRET not configured"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /*
      decoded payload should be:
      {
        id: userId,
        role: "SUPER_ADMIN" | "TRANSPORT_ADMIN" | "DRIVER" | "FACULTY"
      }
    */

    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({
      msg: "Invalid or expired token"
    });
  }
};

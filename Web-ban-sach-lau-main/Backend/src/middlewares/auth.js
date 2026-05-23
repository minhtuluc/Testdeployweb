const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/constants");

/**
 * Middleware xác thực JWT.
 * @param {string[]} roles - Mảng các role được phép truy cập. Để trống = tất cả role.
 */
const authMiddleware = (roles = []) => (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Unauthorized" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    if (roles.length && !roles.includes(decoded.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;

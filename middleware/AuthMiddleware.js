const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  try {
    let token = null;

    // 1. Try Authorization header first (most common method)
    if (req.headers?.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    // 2. Fallback: Try cookies (HTTP-only cookies)
    if (!token) {
      token = req.cookies?.token;
    }

    if (!token) {
      return res.status(401).json({
        error: "No authentication token found. Please log in.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = requireAuth;

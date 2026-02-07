const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  // Try to get token from cookies (HTTP-only cookie) - preferred method
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "No authentication token found. Please log in." });
  }

  console.log("TOKEN FROM COOKIE:", token.substring(0, 20) + "...");
  console.log("VERIFY SECRET:", process.env.JWT_SECRET ? "SET" : "NOT SET");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("JWT decoded:", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT ERROR:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = requireAuth;

const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "No token" });
  }
  console.log("AUTH HEADER RAW:", header);

  const token = header.split(" ")[1];

  console.log("VERIFY TOKEN:", token);
  console.log("VERIFY SECRET:", process.env.JWT_SECRET);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT ERROR:", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = requireAuth;

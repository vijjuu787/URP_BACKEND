const express = require("express");
const router = express.Router();
const pool = require("../db");
const prisma = require("../prisma/index.js").prisma;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const signToken = require("../utils/jwt.js");

router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password, role, resumeUrl } = req.body;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash: hash,
        role: role ?? "candidate",
        resumeUrl: resumeUrl ?? "",
      },
    });

    const token = signToken(user);

    res.json({
      message: "Signup successful",
      token,
      user,
    });
  } catch (err) {
    console.log("signToken:", signToken);
    res.status(500).json({ error: err.message });
  }
});

router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const authToken = req.headers.authorization?.split(" ")[1]; // Extract Bearer token from header
    console.log("AUTH TOKEN RECEIVED:", authToken);
    console.log("email:", email);
    console.log("password:", password);
    // If token is provided, verify it
    if (authToken) {
      try {
        const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
        console.log("Token verified for user:", decoded.email);
      } catch (tokenError) {
        console.log("Token verification failed:", tokenError.message);
        return res.status(401).json({ error: "Invalid or expired token" });
      }
    }

    // Verify credentials
    const user = await prisma.user.findUnique({ where: { email } });
    console.log("User found:", user);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    console.log("Password valid:", valid);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate new token
    const token = signToken(user);

    // Return response with new token and user data
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/signin/admin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const authToken = req.headers.authorization?.split(" ")[1]; // Extract Bearer token from header
    console.log("AUTH TOKEN RECEIVED:", authToken);
    console.log("email:", email);
    console.log("password:", password);
    // If token is provided, verify it
    if (authToken) {
      try {
        const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
        console.log("Token verified for user:", decoded.email);
      } catch (tokenError) {
        console.log("Token verification failed:", tokenError.message);
        return res.status(401).json({ error: "Invalid or expired token" });
      }
    }

    // Verify credentials
    const user = await prisma.user.findUnique({ where: { email } });
    console.log("User found:", user);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    console.log("Password valid:", valid);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate new token
    const token = signToken(user);

    // Return response with new token and user data
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/signin/engineer", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.role !== "engineer") {
    return res.status(403).json({ error: "Not an engineer" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = signToken(user);

  res.json({ message: "Engineer login success", token });
});

module.exports = router;

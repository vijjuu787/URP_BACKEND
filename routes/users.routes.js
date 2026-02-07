const express = require("express");
const router = express.Router();
const pool = require("../db");
const prisma = require("../prisma/index.js").prisma;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const signToken = require("../utils/jwt.js");
const requireAuth = require("../middleware/AuthMiddleware.js");

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

    // Set JWT in HTTP-only cookie
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction, // Only send over HTTPS in production
      sameSite: "none", // Allow cross-site cookie inclusion
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    res.json({
      message: "Signup successful",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (err) {
    console.log("Signup error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verify credentials
    const user = await prisma.user.findUnique({ where: { email } });
    console.log("User found:", user ? user.email : "Not found");

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

    // Set JWT in HTTP-only cookie
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction, // Only send over HTTPS in production
      sameSite: "none", // Allow cross-site cookie inclusion
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    // Return response with user data (token NOT included in response body anymore)
    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Signin error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/signin/admin", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verify credentials
    const user = await prisma.user.findUnique({ where: { email } });
    console.log("Admin user found:", user ? user.email : "Not found");

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

    // Set JWT in HTTP-only cookie
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Return response with user data
    res.json({
      message: "Admin login successful",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Admin signin error:", err.message);
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

// GET /me - Get current authenticated user data
router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    console.log("[/me] User ID from token:", userId);

    if (!userId) {
      return res.status(400).json({ error: "No user ID in token" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "User data retrieved",
      user,
    });
  } catch (err) {
    console.error("[/me] Error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

// POST /logout - Clear the auth cookie
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
  });

  res.json({
    message: "Logout successful",
  });
});

module.exports = router;

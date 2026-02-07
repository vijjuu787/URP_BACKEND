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
    console.log("[SIGNUP] Email:", email);
    console.log("[SIGNUP] Full Name:", fullName);
    console.log("[SIGNUP] Role:", role ?? "candidate");

    console.log("[SIGNUP] Checking if email already exists...");
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      console.log("[SIGNUP] Email already exists - returning 400");
      return res.status(400).json({ error: "Email already exists" });
    }

    console.log("[SIGNUP] Hashing password...");
    const hash = await bcrypt.hash(password, 10);
    console.log("[SIGNUP] Password hashed");

    console.log("[SIGNUP] Creating user in database...");
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash: hash,
        role: role ?? "candidate",
        resumeUrl: resumeUrl ?? "",
      },
    });
    console.log("[SIGNUP] User created successfully:", user.id);

    console.log("[SIGNUP] Generating JWT token...");
    const token = signToken(user);
    console.log("[SIGNUP] Token generated");

    console.log("[SIGNUP] Setting HTTP-only cookie...");
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    console.log("[SIGNUP] Cookie set");

    console.log("[SIGNUP] Sending JSON response...");
    res.json({
      message: "Signup successful",
      token, // Return token so frontend can store and send in Authorization header
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
    console.log("[SIGNUP] Response sent successfully");
    console.log("[SIGNUP] ========================================\n");
  } catch (err) {
    console.error("\n[SIGNUP] ERROR occurred:", err.message);
    console.error("[SIGNUP] Error Stack:", err.stack);
    console.error("[SIGNUP] ========================================\n");
    res.status(500).json({ error: err.message });
  }
});

router.post("/signin", async (req, res) => {
  try {
    console.log("\n[SIGNIN] ========================================");
    console.log("[SIGNIN] Request received at:", new Date().toISOString());

    const { email, password } = req.body;
    console.log("[SIGNIN] Email:", email);
    console.log("[SIGNIN] Password provided:", !!password);

    console.log("[SIGNIN] Querying database for user...");
    const startTime = Date.now();
    const user = await prisma.user.findUnique({ where: { email } });
    const queryTime = Date.now() - startTime;
    console.log(`[SIGNIN] Database query completed in ${queryTime}ms`);
    console.log("[SIGNIN] User found:", user ? user.email : "Not found");

    if (!user) {
      console.log("[SIGNIN] User not found - returning 401");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("[SIGNIN] Comparing passwords...");
    const valid = await bcrypt.compare(password, user.passwordHash);
    console.log("[SIGNIN] Password valid:", valid);

    if (!valid) {
      console.log("[SIGNIN] Invalid password - returning 401");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("[SIGNIN] Generating JWT token...");
    const token = signToken(user);
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    console.log("[SIGNIN] Token generated successfully, expires at:", tokenExpiresAt);

    // Store token in database
    console.log("[SIGNIN] Storing token in database...");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        accessToken: token,
        accessTokenExpiresAt: tokenExpiresAt,
      },
    });
    console.log("[SIGNIN] Token stored in database");

    console.log("[SIGNIN] Setting HTTP-only cookie...");
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    console.log("[SIGNIN] Cookie set successfully");

    console.log("[SIGNIN] Sending JSON response...");
    res.json({
      message: "Login successful",
      token, // Return token so frontend can store and send in Authorization header
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
    console.log("[SIGNIN] Response sent successfully");
    console.log("[SIGNIN] ========================================\n");
  } catch (err) {
    console.error("\n[SIGNIN] ERROR occurred:", err.message);
    console.error("[SIGNIN] Error Stack:", err.stack);
    console.error("[SIGNIN] ========================================\n");
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

    // ALSO return token in response body
    res.json({
      message: "Admin login successful",
      token, // Return token so frontend can store and send in Authorization header
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
  try {
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

    // Set JWT in HTTP-only cookie
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // ALSO return token in response body (primary method)
    res.json({
      message: "Engineer login successful",
      token, // Return token so frontend can store and send in Authorization header
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Engineer signin error:", err.message);
    res.status(500).json({ error: err.message });
  }
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

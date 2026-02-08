const express = require("express");
const router = express.Router();
const pool = require("../db");
const prisma = require("../prisma/index.js").prisma;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const signToken = require("../utils/jwt.js");
const requireAuth = require("../middleware/AuthMiddleware.js");
const uploadResume = require("../middleware/resumeUploadMiddleware.js");

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

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Signup successful",
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

router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

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

// GET /me - Get current authenticated user data
router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;

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

// POST /upload-resume - Upload resume file
router.post("/upload-resume", requireAuth, uploadResume.single("resume"), async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: "No user ID in token" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Generate file URL path
    const resumeUrl = `/uploads/resumes/${req.file.filename}`;

    // Update user with resume URL
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        resumeUrl: resumeUrl,
        resumeFileName: req.file.originalname,
        resumeUploadedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        resumeUrl: true,
        resumeFileName: true,
        resumeUploadedAt: true,
      },
    });

    res.json({
      message: "Resume uploaded successfully",
      resumeUrl: resumeUrl,
      user: updatedUser,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

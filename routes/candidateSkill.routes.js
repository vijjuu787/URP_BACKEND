const express = require("express");
const router = express.Router();
const pool = require("../db");
const { prisma } = require("../prisma/index.js");
const requireAuth = require("../middleware/AuthMiddleware.js");

router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("Authenticated user ID:", userId);
    console.log("Request body:", req.body);
    const {
      primaryRole,
      secondaryRole,
      experienceLevel,
      skill,
      workType,
      jobType,
      experienceAndProject,
    } = req.body;

    // Validate required fields
    if (!primaryRole || !secondaryRole || !experienceLevel || !skill) {
      return res.status(400).json({
        error:
          "primaryRole, secondaryRole, experienceLevel, and skill are required",
      });
    }

    // Validate enum values
    const validRoles = [
      "FRONTEND",
      "BACKEND",
      "FULLSTACK",
      "DEVOPS",
      "DATA_SCIENCE",
      "MOBILE",
      "OTHER",
    ];
    if (!validRoles.includes(secondaryRole.toUpperCase())) {
      return res.status(400).json({
        error: `Invalid secondaryRole. Must be one of: ${validRoles.join(", ")}`,
      });
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    console.log(" user:", user);

    if (!user) {
      return res.status(404).json({
        error:
          "User not found. Please ensure you are logged in with a valid account.",
      });
    }

    // Create or update candidate skill record
    const candidateSkill = await prisma.candidateSkill.create({
      data: {
        userId,
        primaryRole: primaryRole.toUpperCase(),
        secondaryRole: secondaryRole.toUpperCase(),
        experienceLevel: experienceLevel.toUpperCase(),
        skill,
        workType,
        jobType,
        experienceAndProject,
      },
    });

    res.status(201).json({
      message: "Candidate profile updated successfully",
      data: candidateSkill,
    });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

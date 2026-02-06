const express = require("express");
const router = express.Router();
const pool = require("../db");
const { prisma } = require("../prisma/index.js");
const requireAuth = require("../middleware/AuthMiddleware.js");

router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM assignments");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get assignment by jobId
router.get("/job/:jobId", async (req, res) => {
  const { jobId } = req.params;
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { jobId },
      include: { assignmentStarts: true, job: true },
    });

    if (!assignment) {
      return res
        .status(404)
        .json({ error: "Assignment not found for this job" });
    }

    // Convert downloadAssets (Bytes) to base64 for JSON transport
    const downloadAssets = assignment.downloadAssets
      ? assignment.downloadAssets.toString("base64")
      : null;

    res.json({ ...assignment, downloadAssets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  console.log("Request body:", req.body);
  const {
    title,
    description,
    difficulty,
    totalPoints,
    downloadAssets,
    timeLimitHours,
  } = req.body;

  // Validate required fields
  if (
    !title ||
    !description ||
    !difficulty ||
    !totalPoints ||
    !timeLimitHours
  ) {
    return res.status(400).json({
      error:
        "title, description, difficulty, totalPoints, timeLimitHours, and jobId are required",
    });
  }

  try {
    // Verify jobId exists
    // const jobExists = await prisma.jobPosting.findUnique({
    //   where: { id: jobId },
    // });

    // if (!jobExists) {
    //   return res.status(404).json({
    //     error: "JobPosting with specified jobId not found",
    //   });
    // }

    // Convert downloadAssets if provided
    let downloadAssetsBuffer = null;
    if (downloadAssets) {
      if (typeof downloadAssets === "string") {
        downloadAssetsBuffer = Buffer.from(downloadAssets);
      } else if (downloadAssets.data) {
        downloadAssetsBuffer = Buffer.from(downloadAssets.data);
      } else {
        downloadAssetsBuffer = Buffer.from(downloadAssets);
      }
    }

    const result = await prisma.assignment.create({
      data: {
        title,
        description,
        difficulty,
        totalPoints,
        downloadAssets: downloadAssetsBuffer || Buffer.from(""),
        timeLimitHours,
      },
    });

    res.status(201).json({
      message: "Assignment created successfully",
      data: {
        id: result.id,
        title: result.title,
        description: result.description,
        difficulty: result.difficulty,
        totalPoints: result.totalPoints,
        timeLimitHours: result.timeLimitHours,
        createdAt: result.createdAt,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

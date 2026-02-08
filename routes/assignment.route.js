const express = require("express");
const router = express.Router();
const pool = require("../db");
const { prisma } = require("../prisma/index.js");
const requireAuth = require("../middleware/AuthMiddleware.js");
const uploadZip = require("../middleware/zipUploadMiddleware.js");

// Valid difficulty levels from the DifficultyLevel enum
const VALID_DIFFICULTY_LEVELS = ["EASY", "MEDIUM", "HARD"];

// Helper function to validate and normalize difficulty
function validateDifficulty(difficulty) {
  if (!difficulty) return null;
  const normalized = difficulty.toUpperCase();
  if (!VALID_DIFFICULTY_LEVELS.includes(normalized)) {
    throw new Error(
      `Invalid difficulty level. Must be one of: ${VALID_DIFFICULTY_LEVELS.join(", ")}`,
    );
  }
  return normalized;
}

router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM assignments");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get assignment by ID (PUBLIC - no auth required)
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    console.log(`Fetching assignment with id: ${id}`);

    const assignment = await prisma.assignment.findUnique({
      where: { id: String(id) },
      include: {
        job: true,
        assignmentStarts: true,
      },
    });

    if (!assignment) {
      console.log(`No assignment found with id: ${id}`);
      return res.status(404).json({ error: "Assignment not found" });
    }

    // Return assignment with file download URL
    res.json({
      ...assignment,
      downloadAssetsUrl: assignment.downloadAssetsUrl,
      downloadAssetsName: assignment.downloadAssetsName,
      description: assignment.description,
    });
  } catch (err) {
    console.error("Error fetching assignment by ID:", err.message);
    console.error(err);
    res
      .status(500)
      .json({ error: err.message || "Failed to fetch assignment" });
  }
});

// Get assignment by jobId (PUBLIC - no auth required)
router.get("/job/:jobId", async (req, res) => {
  const { jobId } = req.params;
  try {
    console.log(`Fetching assignment for jobId: ${jobId}`);

    const assignment = await prisma.assignment.findUnique({
      where: { jobId: String(jobId) },
      include: {
        job: true,
        assignmentStarts: true,
      },
    });

    if (!assignment) {
      console.log(`No assignment found for jobId: ${jobId}`);
      return res
        .status(404)
        .json({ error: "Assignment not found for this job" });
    }

    // Return assignment with file download URL
    res.json({
      ...assignment,
      downloadAssetsUrl: assignment.downloadAssetsUrl,
      downloadAssetsName: assignment.downloadAssetsName,
      description: assignment.description,
    });
  } catch (err) {
    console.error("Error fetching assignment by jobId:", err.message);
    console.error(err);
    res
      .status(500)
      .json({ error: err.message || "Failed to fetch assignment" });
  }
});

router.post(
  "/",
  requireAuth,
  uploadZip.single("downloadAssets"),
  async (req, res) => {
    console.log("Request body:", req.body);
    const { title, description, difficulty, totalPoints, timeLimitHours } =
      req.body;
    const jobId = req.body.jobId; // jobId is required to link assignment to a job posting

    // Validate required fields
    if (
      !title ||
      !description ||
      !difficulty ||
      !totalPoints ||
      !timeLimitHours ||
      !jobId
    ) {
      return res.status(400).json({
        error:
          "title, description, difficulty, totalPoints, timeLimitHours, and jobId are required",
      });
    }

    try {
      // Validate difficulty enum
      const normalizedDifficulty = validateDifficulty(difficulty);

      // Verify jobId exists
      const jobExists = await prisma.jobPosting.findUnique({
        where: { id: jobId },
      });

      if (!jobExists) {
        return res.status(404).json({
          error: "JobPosting with specified jobId not found",
        });
      }

      // Generate file URL path if ZIP was uploaded
      let downloadAssetsUrl = null;
      let downloadAssetsName = null;
      if (req.file) {
        downloadAssetsUrl = `/uploads/assignments/${req.file.filename}`;
        downloadAssetsName = req.file.originalname;
      }

      const result = await prisma.assignment.create({
        data: {
          title,
          description,
          difficulty: normalizedDifficulty,
          totalPoints,
          downloadAssetsUrl,
          downloadAssetsName,
          timeLimitHours,
          jobId, // This is all we need - the foreign key to connect to the job
        },
        include: {
          job: true, // Include job details in response
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
          downloadAssetsUrl: result.downloadAssetsUrl,
          downloadAssetsName: result.downloadAssetsName,
          createdAt: result.createdAt,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },
);

// GET /download/:assignmentId - Download assignment ZIP file
router.get("/download/:assignmentId", async (req, res) => {
  const { assignmentId } = req.params;
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    if (!assignment.downloadAssetsUrl || !assignment.downloadAssetsName) {
      return res
        .status(404)
        .json({ error: "No download file available for this assignment" });
    }

    // Extract filename from URL path
    const filePath = assignment.downloadAssetsUrl.replace(/^\//, ""); // Remove leading slash
    const fullPath = require("path").join(__dirname, "..", filePath);

    // Download the file
    res.download(fullPath, assignment.downloadAssetsName, (err) => {
      if (err) {
        console.error("Download error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to download file" });
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

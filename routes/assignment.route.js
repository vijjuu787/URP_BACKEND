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

// Get all assignments linked with the same jobId (PUBLIC - no auth required)
router.get("/job/:jobId", async (req, res) => {
  const { jobId } = req.params;

  try {
    const count = await prisma.assignment.count({
      where: { jobId: "f2dd5283-fe9a-40ef-a14a-3d086ba66c51" },
    });

    console.log(count);

    const assignments = await prisma.assignment.findMany({
      where: { jobId },
      include: {
        assignmentStarts: true,
      },
    });
    console.log(
      `Fetched ${assignments.length} assignments for jobId: ${jobId}`,
    );

    return res.status(200).json({
      message: "Assignments retrieved successfully",
      jobId,
      totalAssignments: assignments.length,
      data: assignments,
    });
  } catch (err) {
    console.error("Error fetching assignments by jobId:", err);
    return res.status(500).json({
      error: "Failed to fetch assignments",
    });
  }
});

// POST - Create a new assignment
router.post(
  "/",
  requireAuth,
  uploadZip.single("downloadAssets"),
  async (req, res) => {
    try {
      const {
        title,
        overview,
        techStack,
        description,
        difficulty,
        totalPoints,
        timeLimitHours,
      } = req.body;

      // Validate required fields
      if (!title) {
        return res.status(400).json({ error: "title is required" });
      }

      if (!description) {
        return res.status(400).json({ error: "description is required" });
      }

      if (!difficulty) {
        return res.status(400).json({ error: "difficulty is required" });
      }

      if (!totalPoints) {
        return res.status(400).json({ error: "totalPoints is required" });
      }

      if (!timeLimitHours) {
        return res.status(400).json({ error: "timeLimitHours is required" });
      }

      // Validate difficulty level
      let validatedDifficulty;
      try {
        validatedDifficulty = validateDifficulty(difficulty);
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }

      // Parse techStack if provided (could be JSON string or array)
      let parsedTechStack = [];
      if (techStack) {
        if (typeof techStack === "string") {
          try {
            parsedTechStack = JSON.parse(techStack);
          } catch {
            parsedTechStack = techStack.split(",").map((s) => s.trim());
          }
        } else if (Array.isArray(techStack)) {
          parsedTechStack = techStack;
        }
      }

      // Handle file upload if present
      let downloadAssetsUrl = null;
      let downloadAssetsName = null;

      if (req.file) {
        downloadAssetsUrl = `/uploads/assignments/${req.file.filename}`;
        downloadAssetsName = req.file.originalname;
      }

      // Create assignment
      const assignment = await prisma.assignment.create({
        data: {
          title,
          overview: overview || null,
          techStack: parsedTechStack,
          description,
          difficulty: validatedDifficulty,
          totalPoints: parseInt(totalPoints),
          downloadAssetsUrl,
          downloadAssetsName,
          timeLimitHours: parseInt(timeLimitHours),
        },
      });

      res.status(201).json({
        message: "Assignment created successfully",
        data: assignment,
      });
    } catch (err) {
      console.error("Error creating assignment:", err);
      res
        .status(500)
        .json({ error: err.message || "Failed to create assignment" });
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

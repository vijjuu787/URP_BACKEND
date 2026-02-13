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
    const assignments = await prisma.assignment.findMany({
      include: {
        jobs: {
          select: {
            id: true,
            title: true,
          },
        },
        assignmentStarts: {
          select: {
            id: true,
            candidateId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      message: "All assignments retrieved successfully",
      totalAssignments: assignments.length,
      data: assignments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Database error" });
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
        jobs: true,
        assignmentStarts: true,
      },
    });

    if (!assignment) {
      console.log(`No assignment found with id: ${id}`);
      return res.status(404).json({ error: "Assignment not found" });
    }

    // Return assignment with file download URL
    res.json({
      message: "Assignment retrieved successfully",
      data: {
        ...assignment,
        downloadAssetsUrl: assignment.downloadAssetsUrl,
        downloadAssetsName: assignment.downloadAssetsName,
        description: assignment.description,
      },
    });
  } catch (err) {
    console.error("Error fetching assignment by ID:", err.message);
    console.error(err);
    res
      .status(500)
      .json({ error: err.message || "Failed to fetch assignment" });
  }
});

// Get random assignment ID linked to a jobId (PUBLIC - no auth required)
router.get("/random-by-job/:jobId", async (req, res) => {
  const { jobId } = req.params;

  try {
    console.log(`Fetching random assignment for jobId: ${jobId}`);

    // First verify the job exists
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return res.status(404).json({
        error: "Job posting not found",
        jobId: jobId,
      });
    }

    // Get all assignments linked to this job (many-to-many relationship)
    const assignments = await prisma.assignment.findMany({
      where: {
        jobs: {
          some: {
            id: jobId,
          },
        },
      },
      select: {
        id: true,
        title: true,
        difficulty: true,
        totalPoints: true,
        timeLimitHours: true,
      },
    });

    if (assignments.length === 0) {
      return res.status(404).json({
        error: "No assignments found for this job",
        jobId: jobId,
      });
    }

    // Get random assignment from the list
    const randomAssignment =
      assignments[Math.floor(Math.random() * assignments.length)];

    res.json({
      message: "Random assignment retrieved successfully",
      data: {
        jobId: jobId,
        assignmentId: randomAssignment.id,
        assignmentTitle: randomAssignment.title,
        difficulty: randomAssignment.difficulty,
        totalPoints: randomAssignment.totalPoints,
        timeLimitHours: randomAssignment.timeLimitHours,
      },
    });
  } catch (err) {
    console.error("Error fetching random assignment by jobId:", err.message);
    console.error(err);
    res
      .status(500)
      .json({ error: err.message || "Failed to fetch random assignment" });
  }
});

// Get all assignments linked with the same jobId (PUBLIC - no auth required)
// Since Assignment and JobPosting have many-to-many relationship
router.get("/job/:jobId", async (req, res) => {
  const { jobId } = req.params;

  try {
    console.log(`Fetching all assignments for jobId: ${jobId}`);

    // First verify the job exists
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: {
        assignments: {
          include: {
            assignmentStarts: true,
          },
        },
      },
    });

    if (!job) {
      console.log(`No job found with jobId: ${jobId}`);
      return res.status(404).json({
        error: "Job posting not found",
      });
    }

    // Get all assignments linked to this job
    const assignments = job.assignments;

    console.log(
      `Fetched ${assignments.length} assignments for jobId: ${jobId}`,
    );

    return res.status(200).json({
      message: "Assignments retrieved successfully",
      jobId,
      totalAssignments: assignments.length,
      data: assignments.map((a) => ({
        ...a,
        downloadAssetsUrl: a.downloadAssetsUrl,
        downloadAssetsName: a.downloadAssetsName,
        description: a.description,
      })),
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

// POST - Assign an assignment to a job (many-to-many relationship)
router.post("/assign-to-job/:assignmentId", requireAuth, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { jobId } = req.body;

    // Validate required fields
    if (!jobId) {
      return res.status(400).json({ error: "jobId is required" });
    }

    if (!assignmentId) {
      return res.status(400).json({ error: "assignmentId is required" });
    }

    // Verify assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    // Verify job exists
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return res.status(404).json({ error: "Job posting not found" });
    }

    // Check if assignment is already linked to this job
    const existingLink = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        jobs: {
          some: {
            id: jobId,
          },
        },
      },
    });

    if (existingLink) {
      return res.status(400).json({
        error: "Assignment is already linked to this job",
      });
    }

    // Assign the assignment to the job (update many-to-many relationship)
    const updatedAssignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        jobs: {
          connect: {
            id: jobId,
          },
        },
      },
      include: {
        jobs: true,
      },
    });

    res.status(200).json({
      message: "Assignment assigned to job successfully",
      data: {
        assignmentId: updatedAssignment.id,
        assignmentTitle: updatedAssignment.title,
        jobId: jobId,
        totalJobsLinked: updatedAssignment.jobs.length,
        linkedJobs: updatedAssignment.jobs,
      },
    });
  } catch (err) {
    console.error("Error assigning assignment to job:", err);
    res
      .status(500)
      .json({ error: err.message || "Failed to assign assignment to job" });
  }
});

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

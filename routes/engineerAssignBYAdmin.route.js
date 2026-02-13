const express = require("express");
const router = express.Router();
const pool = require("../db");
const prisma = require("../prisma/index.js").prisma;
const requireAuth = require("../middleware/AuthMiddleware.js");

router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM engineer_assignments");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// GET engineer name from submission ID
router.get("/engineer/:submissionId", requireAuth, async (req, res) => {
  try {
    const { submissionId } = req.params;

    // Validate submissionId is provided
    if (!submissionId) {
      return res.status(400).json({
        error: "submissionId is required",
      });
    }

    // Find all engineer assignments for this submission
    const engineerAssignments = await prisma.engineerAssignment.findMany({
      where: { submissionId },
      select: {
        id: true,
        status: true,
        assignedAt: true,
        engineer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (engineerAssignments.length === 0) {
      return res.status(404).json({
        error: "No engineers assigned to this submission",
      });
    }

    // Map to get engineer details
    const engineers = engineerAssignments.map((assignment) => ({
      id: assignment.id,
      engineerId: assignment.engineer.id,
      engineerName: assignment.engineer.fullName,
      engineerEmail: assignment.engineer.email,
      status: assignment.status,
      assignedAt: assignment.assignedAt,
    }));

    res.json({
      message: "Engineers retrieved successfully",
      submissionId,
      count: engineers.length,
      data: engineers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET detailed submission info from engineer assignment ID
router.get("/submission-details/:assignmentId", requireAuth, async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // Validate assignmentId is provided
    if (!assignmentId) {
      return res.status(400).json({
        error: "assignmentId is required",
      });
    }

    // Find the engineer assignment with all related data
    const engineerAssignment = await prisma.engineerAssignment.findUnique({
      where: { id: assignmentId },
      select: {
        id: true,
        status: true,
        assignedAt: true,
        submission: {
          select: {
            id: true,
            submittedAt: true,
            candidate: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            submissionFiles: {
              select: {
                id: true,
                fileName: true,
                fileUrl: true,
                fileType: true,
              },
            },
            assignmentStartedAt: true,
          },
        },
        engineer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!engineerAssignment) {
      return res.status(404).json({
        error: "Engineer assignment not found",
      });
    }

    // Get assignment and job details through AssignmentStart
    const assignmentStart = await prisma.assignmentStart.findFirst({
      where: {
        assignmentId: engineerAssignment.submission.id,
        candidateId: engineerAssignment.submission.candidate.id,
      },
      select: {
        assignment: {
          select: {
            id: true,
            title: true,
            description: true,
            difficulty: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            roleType: true,
          },
        },
      },
    });

    // Map job role type to readable format
    const roleTypeMap = {
      "Frontend Engineer": "Frontend Engineer",
      "Backend Engineer": "Backend Engineer",
      "Full Stack Engineer": "Full Stack Engineer",
      frontend: "Frontend Engineer",
      backend: "Backend Engineer",
      fullstack: "Full Stack Engineer",
      full_stack: "Full Stack Engineer",
    };

    const jobRole =
      roleTypeMap[assignmentStart?.job?.roleType] || assignmentStart?.job?.roleType || "Unknown Role";

    // Transform submission files to match the expected format
    const submissionFiles = engineerAssignment.submission.submissionFiles.map((file) => ({
      id: file.id,
      name: file.fileName || "Untitled File",
      url: file.fileUrl || "",
      type: file.fileType?.toLowerCase() || "other",
    }));

    // Build the response
    const submissionData = {
      id: engineerAssignment.submission.id,
      engineerAssignmentId: engineerAssignment.id,
      candidateName: engineerAssignment.submission.candidate.fullName,
      candidateEmail: engineerAssignment.submission.candidate.email,
      candidateId: engineerAssignment.submission.candidate.id,
      jobRole: jobRole,
      assignmentTitle: assignmentStart?.assignment?.title || "Unknown Assignment",
      assignmentDescription: assignmentStart?.assignment?.description || "",
      assignmentDifficulty: assignmentStart?.assignment?.difficulty || "UNKNOWN",
      submissionDate: engineerAssignment.submission.submittedAt
        ? new Date(engineerAssignment.submission.submittedAt).toISOString()
        : null,
      submissionStatus: engineerAssignment.status,
      assignedAt: engineerAssignment.assignedAt,
      submissionFiles: submissionFiles,
      engineer: {
        id: engineerAssignment.engineer.id,
        name: engineerAssignment.engineer.fullName,
        email: engineerAssignment.engineer.email,
      },
    };

    res.json({
      message: "Submission details retrieved successfully",
      data: submissionData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { submissionId, engineerId, assignedById, status } = req.body;

    const result = await prisma.engineerAssignment.create({
      data: {
        submissionId,
        engineerId,
        assignedById,
        status: status ?? "PENDING",
      },
      include: {
        submission: true,
        engineer: true,
        assignedBy: true,
      },
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports = router;

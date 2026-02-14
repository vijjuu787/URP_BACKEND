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

// GET all submissions with detailed information for a specific engineer
router.get(
  "/submissions/engineer/:engineerId/details",
  requireAuth,
  async (req, res) => {
    try {
      const { engineerId } = req.params;

      // Validate engineerId is provided
      if (!engineerId) {
        return res.status(400).json({
          error: "engineerId is required",
        });
      }

      // Find all engineer assignments for this engineer with all related data
      const engineerAssignments = await prisma.engineerAssignment.findMany({
        where: { engineerId },
        select: {
          id: true,
          status: true,
          assignedAt: true,
          submission: {
            select: {
              id: true,
              submittedAt: true,
              assignmentId: true,
              candidateId: true,
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
        orderBy: { assignedAt: "desc" },
      });

      if (engineerAssignments.length === 0) {
        return res.json({
          message: "No submissions assigned to this engineer",
          engineerId,
          count: 0,
          data: [],
        });
      }

      // Get all unique assignmentId and candidateId pairs to fetch assignment/job details
      const assignmentStartQueries = engineerAssignments.map((ea) => ({
        assignmentId: ea.submission.assignmentId,
        candidateId: ea.submission.candidateId,
      }));

      // Get assignment and job details through AssignmentStart
      const assignmentStarts = await prisma.assignmentStart.findMany({
        where: {
          OR: assignmentStartQueries,
        },
        select: {
          assignmentId: true,
          candidateId: true,
          jobId: true,
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

      // Create a map for quick lookup
      const assignmentStartMap = {};
      assignmentStarts.forEach((start) => {
        const key = `${start.assignmentId}_${start.candidateId}`;
        assignmentStartMap[key] = start;
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

      // Transform all submissions
      const submissionDataArray = engineerAssignments.map((ea) => {
        const key = `${ea.submission.assignmentId}_${ea.submission.candidateId}`;
        const assignmentStart = assignmentStartMap[key];

        const jobRole =
          roleTypeMap[assignmentStart?.job?.roleType] ||
          assignmentStart?.job?.roleType ||
          "Unknown Role";

        const submissionFiles = ea.submission.submissionFiles.map((file) => ({
          id: file.id,
          name: file.fileName || "Untitled File",
          url: file.fileUrl || "",
          type: file.fileType?.toLowerCase() || "other",
        }));

        return {
          id: ea.submission.id,
          engineerAssignmentId: ea.id,
          candidateName: ea.submission.candidate.fullName,
          candidateEmail: ea.submission.candidate.email,
          candidateId: ea.submission.candidate.id,
          jobRole: jobRole,
          jobId: assignmentStart?.jobId || "Unknown Job",
          jobTitle: assignmentStart?.job?.title || "Unknown Job Title",
          assignmentId: ea.submission.assignmentId,
          assignmentTitle:
            assignmentStart?.assignment?.title || "Unknown Assignment",
          assignmentDescription: assignmentStart?.assignment?.description || "",
          assignmentDifficulty:
            assignmentStart?.assignment?.difficulty || "UNKNOWN",
          submissionDate: ea.submission.submittedAt
            ? new Date(ea.submission.submittedAt).toISOString()
            : null,
          submissionStatus: ea.status,
          assignedAt: ea.assignedAt,
          submissionFiles: submissionFiles,
          engineer: {
            id: ea.engineer.id,
            name: ea.engineer.fullName,
            email: ea.engineer.email,
          },
        };
      });

      res.json({
        message: "Engineer submission details retrieved successfully",
        engineerId,
        engineerName: engineerAssignments[0].engineer.fullName,
        count: submissionDataArray.length,
        data: submissionDataArray,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },
);

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

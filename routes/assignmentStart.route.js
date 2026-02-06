const express = require("express");
const router = express.Router();
const pool = require("../db");
const { prisma } = require("../prisma/index.js");
const requireAuth = require("../middleware/AuthMiddleware.js");

// GET all assignment starts for authenticated user
router.get("/", requireAuth, async (req, res) => {
  try {
    const candidateId = req.user.id;

    const assignmentStarts = await prisma.assignmentStart.findMany({
      where: { candidateId },
      include: {
        assignment: true,
        job: true,
        candidate: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    res.json({
      message: "Assignment starts retrieved successfully",
      data: assignmentStarts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET all assignments for a specific candidate ID (can be used by admins)
router.get("/candidate/:candidateId", requireAuth, async (req, res) => {
  try {
    const { candidateId } = req.params;

    // Validate candidateId is provided
    if (!candidateId) {
      return res.status(400).json({
        error: "candidateId is required",
      });
    }

    // Verify candidate exists
    const candidate = await prisma.user.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      return res.status(404).json({
        error: "Candidate not found",
      });
    }

    // Get all assignments started by this candidate
    const assignmentStarts = await prisma.assignmentStart.findMany({
      where: { candidateId },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            description: true,
            difficulty: true,
            totalPoints: true,
            timeLimitHours: true,
            createdAt: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            description: true,
            roleType: true,
            requirements: true,
            difficulty: true,
            points: true,
          },
        },
        candidate: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { startedAt: "desc" }, // Most recent first
    });

    if (assignmentStarts.length === 0) {
      return res.json({
        message: "No assignments found for this candidate",
        data: [],
      });
    }

    res.json({
      message: "Assignments retrieved successfully",
      count: assignmentStarts.length,
      data: assignmentStarts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST - Start an assignment (create AssignmentStart record)
router.post("/", requireAuth, async (req, res) => {
  try {
    console.log("Request body:", req.body);

    const { assignmentId, candidateId, jobId } = req.body;
    // const candidateId = req.user.id;
    console.log("Authenticated user ID (candidateId):", candidateId);

    // Validate required fields
    if (!assignmentId) {
      return res.status(400).json({
        error: "assignmentId is required",
      });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: candidateId },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Verify assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return res.status(404).json({
        error: "Assignment not found",
      });
    }

    // Check if user has already started this assignment
    const existingStart = await prisma.assignmentStart.findFirst({
      where: {
        candidateId,
        assignmentId,
      },
      include: {
        assignment: true,
        job: true,
        candidate: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // If already exists, return the existing entry
    if (existingStart) {
      return res.status(200).json({
        message: "Assignment start record already exists",
        data: existingStart,
      });
    }

    // Create assignment start record
    const assignmentStart = await prisma.assignmentStart.create({
      data: {
        candidateId,
        assignmentId,
        jobId,
        startedAt: new Date(),
      },
      include: {
        assignment: true,
        job: true,
        candidate: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Assignment started successfully",
      data: assignmentStart,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET specific assignment start by ID
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const candidateId = req.user.id;

    const assignmentStart = await prisma.assignmentStart.findFirst({
      where: {
        id,
        candidateId, // Ensure user can only view their own records
      },
      include: {
        assignment: true,
        job: true,
        candidate: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!assignmentStart) {
      return res.status(404).json({
        error: "Assignment start record not found",
      });
    }

    res.json({
      message: "Assignment start retrieved successfully",
      data: assignmentStart,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const pool = require("../db");
const { prisma } = require("../prisma/index.js");
const requireAuth = require("../middleware/AuthMiddleware.js");
const { describe } = require("node:test");

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

// User applies for a job by starting the assignment for that job
router.get("/applied-jobs/all", requireAuth, async (req, res) => {
  try {
    const candidateId = req.user.id; // Authenticated user = candidate

    // Get all jobs this user/candidate has applied for (by starting assignments)
    const userApplications = await prisma.assignmentStart.findMany({
      where: { candidateId },
      select: {
        jobId: true,
        startedAt: true,
        job: {
          select: {
            id: true,
            title: true,
            description: true,
            roleType: true,
            difficulty: true,
            points: true,
            status: true,
            createdAt: true,
          },
        },
        assignment: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            timeLimitHours: true,
          },
        },
      },
      orderBy: { startedAt: "desc" }, // Most recent first
    });

    // Extract unique job IDs that this user has applied for
    const appliedJobIds = [
      ...new Set(userApplications.map((app) => app.jobId)),
    ];

    res.json({
      message: "User applications retrieved successfully",
      userId: candidateId,
      totalJobsAppliedFor: appliedJobIds.length,
      data: {
        appliedJobIds: appliedJobIds,
        userApplications: userApplications,
      },
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

router.get("/timing/:assignmentStartId", requireAuth, async (req, res) => {
  try {
    const { assignmentStartId } = req.params;
    const candidateId = req.user?.id;

    if (!candidateId) {
      return res.status(400).json({ error: "No user ID in token" });
    }

    // Get the assignment start record
    const assignmentStart = await prisma.assignmentStart.findFirst({
      where: {
        id: assignmentStartId,
        candidateId, // Ensure user can only view their own timing
      },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            timeLimitHours: true,
            totalPoints: true,
          },
        },
      },
    });

    if (!assignmentStart) {
      return res.status(404).json({
        error: "Assignment start record not found",
      });
    }

    const now = new Date();
    const startedAt = new Date(assignmentStart.startedAt);

    // Calculate timing
    const elapsedMilliseconds = now - startedAt;
    const elapsedMinutes = Math.floor(elapsedMilliseconds / (1000 * 60));
    const elapsedHours = Math.floor(elapsedMinutes / 60);

    const totalTimeAllowedMinutes =
      assignmentStart.assignment.timeLimitHours * 60;
    const remainingMinutes = totalTimeAllowedMinutes - elapsedMinutes;
    const remainingHours = Math.floor(remainingMinutes / 60);
    const remainingMilliseconds = Math.max(0, remainingMinutes * 60 * 1000);

    const isTimeExpired = remainingMinutes <= 0;
    const percentageTimeUsed = Math.floor(
      (elapsedMinutes / totalTimeAllowedMinutes) * 100,
    );

    res.json({
      message: "Assignment timing retrieved successfully",
      data: {
        assignmentStartId,
        assignmentId: assignmentStart.assignment.id,
        assignmentTitle: assignmentStart.assignment.title,
        startedAt: assignmentStart.startedAt,
        now: now,
        timing: {
          totalTimeAllowedHours: assignmentStart.assignment.timeLimitHours,
          totalTimeAllowedMinutes: totalTimeAllowedMinutes,
          elapsedMinutes: elapsedMinutes,
          elapsedHours: elapsedHours,
          elapsedSeconds: Math.floor((elapsedMilliseconds / 1000) % 60),
          remainingMinutes: Math.max(0, remainingMinutes),
          remainingHours: Math.max(0, remainingHours),
          remainingSeconds: Math.max(
            0,
            Math.floor((remainingMilliseconds / 1000) % 60),
          ),
          percentageTimeUsed: Math.min(100, percentageTimeUsed),
          isTimeExpired: isTimeExpired,
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET all assignment timings for authenticated user (useful for dashboard)
router.get("/timings/all/current", requireAuth, async (req, res) => {
  try {
    const candidateId = req.user?.id;

    if (!candidateId) {
      return res.status(400).json({ error: "No user ID in token" });
    }

    const now = new Date();

    // Get all active assignment starts for this user
    const assignmentStarts = await prisma.assignmentStart.findMany({
      where: { candidateId },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            timeLimitHours: true,
            totalPoints: true,
            difficulty: true,
          },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    // Calculate timing for each assignment
    const timingData = assignmentStarts.map((start) => {
      const startedAt = new Date(start.startedAt);
      const elapsedMilliseconds = now - startedAt;
      const elapsedMinutes = Math.floor(elapsedMilliseconds / (1000 * 60));
      const totalTimeAllowedMinutes = start.assignment.timeLimitHours * 60;
      const remainingMinutes = totalTimeAllowedMinutes - elapsedMinutes;
      const remainingMilliseconds = Math.max(0, remainingMinutes * 60 * 1000);

      return {
        assignmentStartId: start.id,
        assignmentId: start.assignment.id,
        assignmentTitle: start.assignment.title,
        assignmentDifficulty: start.assignment.difficulty,
        assignmentPoints: start.assignment.totalPoints,
        startedAt: start.startedAt,
        timing: {
          totalTimeAllowedHours: start.assignment.timeLimitHours,
          totalTimeAllowedMinutes: totalTimeAllowedMinutes,
          elapsedMinutes: elapsedMinutes,
          remainingMinutes: Math.max(0, remainingMinutes),
          percentageTimeUsed: Math.min(
            100,
            Math.floor((elapsedMinutes / totalTimeAllowedMinutes) * 100),
          ),
          isTimeExpired: remainingMinutes <= 0,
        },
      };
    });

    res.json({
      message: "All assignment timings retrieved successfully",
      count: timingData.length,
      data: timingData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET assignmentStart ID through jobID
// Must be BEFORE /job/:jobId and /:id routes to match properly
router.get("/from-job/:jobId", requireAuth, async (req, res) => {
  try {
    const { jobId, assignmentId } = req.params;
    const candidateId = req.user?.id;

    if (!candidateId) {
      return res.status(400).json({ error: "No user ID in token" });
    }

    // Get the assignment start record for this job and candidate
    const assignmentStart = await prisma.assignmentStart.findFirst({
      where: {
        jobId,
        candidateId, // Ensure user can only view their own records
        assignmentId,
      },
      select: {
        id: true,
        jobId: true,
        assignmentId: true,
        candidateId: true,
        startedAt: true,
        assignment: {
          select: {
            id: true,
            title: true,
            overview: true,
            objective: true,
            difficulty: true,
            description: true,
            totalPoints: true,
            timeLimitHours: true,
          },
        },
      },
    });

    if (!assignmentStart) {
      return res.status(404).json({
        error: "No assignment start found for this job",
      });
    }

    res.json({
      message: "Assignment start ID retrieved successfully",
      data: assignmentStart,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET jobID and job details from assignmentStartID
router.get("/job/:assignmentStartId", requireAuth, async (req, res) => {
  try {
    const { assignmentStartId } = req.params;
    const candidateId = req.user?.id;

    if (!candidateId) {
      return res.status(400).json({ error: "No user ID in token" });
    }

    // Get the assignment start record with job details
    const assignmentStart = await prisma.assignmentStart.findFirst({
      where: {
        id: assignmentStartId,
        candidateId, // Ensure user can only view their own records
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            description: true,
            workType: true,
            roleType: true,
            requirements: true,
            difficulty: true,
            points: true,
            status: true,
            createdAt: true,
          },
        },
        assignment: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            totalPoints: true,
            timeLimitHours: true,
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
      message: "Job details retrieved successfully",
      data: {
        assignmentStartId,
        jobId: assignmentStart.jobId,
        job: assignmentStart.job,
        assignment: assignmentStart.assignment,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    console.log("Request body:", req.body);

    const { assignmentId, candidateId, jobId } = req.body;
    // const candidateId = req.user.id;
    console.log("Authenticated user ID (candidateId):", candidateId);
    console.log("Received - assignmentId:", assignmentId, "jobId:", jobId);

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
        assignmentId: assignmentId,
      });
    }

    // Validate jobId if provided
    if (jobId) {
      const job = await prisma.jobPosting.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        return res.status(404).json({
          error: "Job posting not found",
          jobId: jobId,
        });
      }
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
        jobId: jobId || null,
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
    console.error("Error creating assignment start:", err);
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

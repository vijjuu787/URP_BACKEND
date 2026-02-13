const express = require("express");
const router = express.Router();
const pool = require("../db");
const { prisma } = require("../prisma/index.js");
const requireAuth = require("../middleware/AuthMiddleware.js");

// GET all assignment submissions with summary (candidate name, assignment title, submitted time)
router.get("/all/summary", async (req, res) => {
  try {
    console.log("GET /all/summary endpoint called");
    
    // Get all assignment submissions with candidate and basic info
    const submissions = await prisma.assignmentSubmission.findMany({
      select: {
        id: true,
        submittedAt: true,
        candidate: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    console.log(`Found ${submissions.length} submissions`);

    if (submissions.length === 0) {
      return res.json({
        message: "No assignment submissions found",
        count: 0,
        data: [],
      });
    }

    // Transform data to include all required fields
    const submissionSummary = submissions.map((sub) => ({
      id: sub.id,
      candidateName: sub.candidate.fullName,
      submittedTime: sub.submittedAt,
    }));

    res.json({
      message: "All assignment submissions retrieved successfully",
      count: submissionSummary.length,
      data: submissionSummary,
    });
  } catch (err) {
    console.error("Error in /all/summary:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET all assignment submissions for a specific candidate ID (PUBLIC)
router.get("/candidate/:candidateId", async (req, res) => {
  try {
    const { candidateId } = req.params;

    // Validate candidateId is provided
    if (!candidateId) {
      return res.status(400).json({
        error: "candidateId path parameter is required",
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

    // Get all assignment submissions for this candidate
    const submissions = await prisma.assignmentSubmission.findMany({
      where: { candidateId },
      include: {
        submissionFiles: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileUrl: true,
            uploadedAt: true,
          },
        },
        reviews: {
          select: {
            id: true,
            codeQualityScore: true,
            logicProblemSolvingScore: true,
            bestPracticesScore: true,
            totalScore: true,
            feedback: true,
            status: true,
            recommendation: true,
            reviewedAt: true,
          },
        },
        candidate: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        engineerAssignments: {
          select: {
            id: true,
            engineerId: true,
            assignedById: true,
            status: true,
            assignedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (submissions.length === 0) {
      return res.json({
        message: "No assignment submissions found for this candidate",
        count: 0,
        data: [],
      });
    }

    res.json({
      message: "Assignment submissions retrieved successfully",
      count: submissions.length,
      data: submissions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    console.log("Request body:", req.body);
    console.log("Authenticated user:", req.user);

    const {
      assignmentId,
      assignmentStartedAt,
      submittedAt,
      timeTakenMinutes,
      deadline,
      status,
      candidateNotes,
      candidateId,
    } = req.body;

    // Get userId from JWT token

    // Validate assignmentId is provided
    if (!assignmentId) {
      return res.status(400).json({
        error: "assignmentId is required",
      });
    }

    // Validate candidateId is provided
    if (!candidateId) {
      return res.status(400).json({
        error: "candidateId is required",
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

    // Verify candidate exists
    const candidate = await prisma.user.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      return res.status(404).json({
        error: "Candidate not found",
      });
    }

    // Upsert assignment submission - update if exists, create if not
    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_candidateId: {
          assignmentId,
          candidateId,
        },
      },
      update: {
        submittedAt: submittedAt ? new Date(submittedAt) : null,
        timeTakenMinutes: timeTakenMinutes || null,
        status: status || "PENDING",
        candidateNotes: candidateNotes || null,
        updatedAt: new Date(),
      },
      create: {
        candidateId,
        assignmentId,
        assignmentStartedAt: assignmentStartedAt
          ? new Date(assignmentStartedAt)
          : new Date(),
        submittedAt: submittedAt ? new Date(submittedAt) : null,
        timeTakenMinutes: timeTakenMinutes || null,
        deadline: deadline ? new Date(deadline) : null,
        status: status || "NOT_STARTED",
        candidateNotes: candidateNotes || null,
      },
      include: {
        submissionFiles: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileUrl: true,
            uploadedAt: true,
          },
        },
        reviews: {
          select: {
            id: true,
            codeQualityScore: true,
            logicProblemSolvingScore: true,
            bestPracticesScore: true,
            totalScore: true,
            feedback: true,
            status: true,
            recommendation: true,
            reviewedAt: true,
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
    });

    res.status(201).json({
      message: "Assignment submission created/updated successfully",
      submission,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

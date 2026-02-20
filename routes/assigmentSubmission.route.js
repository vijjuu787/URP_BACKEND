const express = require("express");
const router = express.Router();
const pool = require("../db");
const { prisma } = require("../prisma/index.js");
const requireAuth = require("../middleware/AuthMiddleware.js");

// GET submission content by submission ID
router.get("/:submissionId/content", async (req, res) => {
  try {
    const { submissionId } = req.params;

    // Validate submissionId is provided
    if (!submissionId) {
      return res.status(400).json({
        error: "submissionId is required",
      });
    }

    // Get submission with content
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        submissionContent: true,
        candidateId: true,
        assignmentId: true,
        submittedAt: true,
      },
    });

    if (!submission) {
      return res.status(404).json({
        error: "Submission not found",
      });
    }

    res.json({
      message: "Submission content retrieved successfully",
      submissionId,
      submissionContent: submission.submissionContent,
      candidateId: submission.candidateId,
      assignmentId: submission.assignmentId,
      submittedAt: submission.submittedAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET all assignment submissions with summary (candidate name, assignment title, job title, submitted time) - only submitted
router.get("/all/summary", async (req, res) => {
  try {
    console.log("GET /all/summary endpoint called");

    // Get all assignment submissions with candidate info - ONLY where submittedAt is NOT NULL
    const submissions = await prisma.assignmentSubmission.findMany({
      where: {
        submittedAt: {
          not: null,
        },
      },
      select: {
        id: true,
        submittedAt: true,
        assignmentId: true,
        candidateId: true,
        candidate: {
          select: {
            fullName: true,
            resumeUrl: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    console.log(`Found ${submissions.length} submitted submissions`);

    if (submissions.length === 0) {
      return res.json({
        message: "No submitted assignment submissions found",
        count: 0,
        data: [],
      });
    }

    // Get assignment titles for all assignmentIds
    const assignmentIds = [
      ...new Set(submissions.map((sub) => sub.assignmentId)),
    ];
    const assignments = await prisma.assignment.findMany({
      where: { id: { in: assignmentIds } },
      select: { id: true, title: true },
    });

    // Create a map of assignmentId -> title
    const assignmentTitleMap = {};
    assignments.forEach((assignment) => {
      assignmentTitleMap[assignment.id] = assignment.title;
    });

    // Get job titles from AssignmentStart for each submission
    const assignmentStarts = await prisma.assignmentStart.findMany({
      where: {
        assignmentId: { in: assignmentIds },
      },
      select: {
        assignmentId: true,
        candidateId: true,
        job: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Create a map of assignmentId_candidateId -> jobTitle
    const jobTitleMap = {};
    assignmentStarts.forEach((start) => {
      const key = `${start.assignmentId}_${start.candidateId}`;
      jobTitleMap[key] = start.job.title;
    });

    // Transform data to include all required fields
    const submissionSummary = submissions.map((sub) => {
      const key = `${sub.assignmentId}_${sub.candidateId}`;
      return {
        id: sub.id,
        candidateName: sub.candidate.fullName,
        candidateResumeUrl: sub.candidate.resumeUrl,
        assignmentTitle:
          assignmentTitleMap[sub.assignmentId] || "Unknown Assignment",
        jobTitle: jobTitleMap[key] || "Unknown Job",
        submittedTime: sub.submittedAt,
      };
    });

    res.json({
      message: "All submitted assignment submissions retrieved successfully",
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
      jobID,
      assignmentStartedAt,
      submittedAt,
      timeTakenMinutes,
      deadline,
      status,
      candidateNotes,
      candidateId,
      submissionContent,
    } = req.body;

    // Get userId from JWT token

    // Validate assignmentId is provided
    if (!assignmentId) {
      return res.status(400).json({
        error: "assignmentId is required",
      });
    }

    // Validate jobID is provided
    if (!jobID) {
      return res.status(400).json({
        error: "jobID is required",
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

    // Verify job exists
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobID },
    });

    if (!job) {
      return res.status(404).json({
        error: "Job posting not found",
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
        jobID,
        submittedAt: submittedAt ? new Date(submittedAt) : null,
        timeTakenMinutes: timeTakenMinutes || null,
        status: status || "PENDING",
        candidateNotes: candidateNotes || null,
        submissionContent: submissionContent || null,
        updatedAt: new Date(),
      },
      create: {
        candidateId,
        assignmentId,
        jobID,
        assignmentStartedAt: assignmentStartedAt
          ? new Date(assignmentStartedAt)
          : new Date(),
        submittedAt: submittedAt ? new Date(submittedAt) : null,
        timeTakenMinutes: timeTakenMinutes || null,
        deadline: deadline ? new Date(deadline) : null,
        status: status || "NOT_STARTED",
        candidateNotes: candidateNotes || null,
        submissionContent: submissionContent || null,
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

// GET submission IDs by jobID
router.get("/by-job/:jobID", async (req, res) => {
  try {
    const { jobID } = req.params;

    // Validate jobID is provided
    if (!jobID) {
      return res.status(400).json({
        error: "jobID is required",
      });
    }

    // Verify job exists
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobID },
      select: {
        id: true,
        title: true,
      },
    });

    if (!job) {
      return res.status(404).json({
        error: "Job posting not found",
      });
    }

    // Get all submissions for this jobID
    const submissions = await prisma.assignmentSubmission.findMany({
      where: { jobID },
      select: {
        id: true,
        jobID: true,
        assignmentId: true,
        candidateId: true,
        status: true,
        submittedAt: true,
        createdAt: true,
        candidate: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (submissions.length === 0) {
      return res.json({
        message: "No submissions found for this job",
        jobID,
        jobTitle: job.title,
        count: 0,
        data: [],
      });
    }

    res.json({
      message: "Submissions retrieved successfully by jobID",
      jobID,
      jobTitle: job.title,
      count: submissions.length,
      data: submissions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const pool = require("../db");
const { prisma } = require("../prisma/index.js");
const requireAuth = require("../middleware/AuthMiddleware.js");

router.get("/", async (req, res) => {
  try {
    const result = await prisma.jobPosting.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(result);
  } catch (err) {
    console.error("Error fetching job postings:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  // if (req.user.role !== "admin") {
  //   return res.status(403).json({ error: "Access denied" });
  // }
  console.log("Request body:", req.body);
  const {
    title,
    description,
    company,
    workType,
    roleType,
    requirements,
    responsibilities,
    difficulty,
    points,
    status,
    salaryRange,
    experienceLevel,
    postDate,
    createdAt,
    updatedAt,
  } = req.body;

  try {
    // Convert array to string if needed
    const reqString = Array.isArray(requirements)
      ? requirements.join(", ")
      : requirements;
    const respString = Array.isArray(responsibilities)
      ? responsibilities.join(", ")
      : responsibilities;

    const result = await prisma.jobPosting.create({
      data: {
        title,
        workType,
        description,
        company,
        roleType,
        requirements: reqString,
        difficulty,
        experienceLevel,
        salaryRange,
        responsibilities: respString,
        points,
        status: status || "open",
        postDate: postDate ? new Date(postDate) : new Date(),
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
      },
    });

    res.status(201).json({
      message: "Job posting created successfully",
      data: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET assignments for a particular jobID
router.get("/:jobId/assignments", async (req, res) => {
  try {
    const { jobId } = req.params;

    // Validate jobId
    if (!jobId) {
      return res.status(400).json({ error: "jobId is required" });
    }

    // Check if job exists
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return res.status(404).json({ error: "Job posting not found" });
    }

    // Get all assignments linked to this job
    const assignments = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        assignments: {
          select: {
            id: true,
            title: true,
            overview: true,
            objective: true,
            difficulty: true,
            description: true,
            totalPoints: true,
            timeLimitHours: true,
            techStack: true,
            downloadAssetsUrl: true,
            downloadAssetsName: true,
            createdAt: true,
          },
        },
      },
    });

    res.json({
      message: "Assignments retrieved successfully",
      jobId,
      jobTitle: assignments.title,
      assignments: assignments.assignments,
      totalAssignments: assignments.assignments.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE job posting
router.put("/:jobId", requireAuth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const {
      title,
      description,
      company,
      workType,
      roleType,
      requirements,
      responsibilities,
      difficulty,
      points,
      status,
      salaryRange,
      experienceLevel,
    } = req.body;

    // Validate jobId
    if (!jobId) {
      return res.status(400).json({ error: "jobId is required" });
    }

    // Check if job exists
    const existingJob = await prisma.jobPosting.findUnique({
      where: { id: jobId },
    });

    if (!existingJob) {
      return res.status(404).json({ error: "Job posting not found" });
    }

    // Convert array to string if needed
    const reqString = Array.isArray(requirements)
      ? requirements.join(", ")
      : requirements;
    const respString = Array.isArray(responsibilities)
      ? responsibilities.join(", ")
      : responsibilities;

    const updatedJob = await prisma.jobPosting.update({
      where: { id: jobId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(company && { company }),
        ...(workType && { workType }),
        ...(roleType && { roleType }),
        ...(requirements && { requirements: reqString }),
        ...(difficulty && { difficulty }),
        ...(experienceLevel && { experienceLevel }),
        ...(salaryRange && { salaryRange }),
        ...(responsibilities && { responsibilities: respString }),
        ...(points && { points }),
        ...(status && { status }),
      },
    });

    res.json({
      message: "Job posting updated successfully",
      data: updatedJob,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE job posting
router.delete("/:jobId", requireAuth, async (req, res) => {
  try {
    const { jobId } = req.params;

    // Validate jobId
    if (!jobId) {
      return res.status(400).json({ error: "jobId is required" });
    }

    // Check if job exists
    const existingJob = await prisma.jobPosting.findUnique({
      where: { id: jobId },
    });

    if (!existingJob) {
      return res.status(404).json({ error: "Job posting not found" });
    }

    // Delete the job posting
    await prisma.jobPosting.delete({
      where: { id: jobId },
    });

    res.json({
      message: "Job posting deleted successfully",
      deletedId: jobId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

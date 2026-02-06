const express = require("express");
const router = express.Router();
const pool = require("../db");
const { prisma } = require("../prisma/index.js");
const requireAuth = require("../middleware/AuthMiddleware.js");

router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM job_postings");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
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

module.exports = router;

const express = require("express");
const router = express.Router();
const pool = require("../db");
const { login } = require("../controllers/AuthCtrls.js");
const prisma = require("../prisma/index.js").prisma;
const requireAuth = require("../middleware/AuthMiddleware.js");

router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM assignment_reviews");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});
router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      submissionId,
      engineerId,
      codeQualityScore,
      logicProblemSolvingScore,
      bestPracticesScore,
      feedback,
      recommendation,
    } = req.body;

    const totalScore =
      (codeQualityScore + logicProblemSolvingScore + bestPracticesScore) / 3;

    const result = await prisma.AssignmentReview.create({
      data: {
        submissionId,
        engineerId,
        codeQualityScore,
        logicProblemSolvingScore,
        bestPracticesScore,
        totalScore,
        feedback: feedback ?? null,
        recommendation: recommendation ?? null,
        reviewedAt: new Date(),
        status: "SUBMITTED",
      },
      include: {
        submission: true,
        engineer: true,
      },
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

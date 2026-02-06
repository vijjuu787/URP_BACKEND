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

router.post("/", requireAuth, async (req, res) => {
  try {
    const { submissionId, engineerId, assignedById, status } = req.body;

    const result = await prisma.EngineerAssignment.create({
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

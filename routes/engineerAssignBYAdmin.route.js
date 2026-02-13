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

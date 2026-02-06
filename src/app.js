require("dotenv").config();
const express = require("express");
const cors = require("cors");

const pool = require("../db");

const userRoutes = require("../routes/users.routes");
const candidateSkillRoutes = require("../routes/candidateSkill.routes");
const jobPostRoutes = require("../routes/jobPost.route");
const AssignmentRoutes = require("../routes/assignment.route");
const assignmentSubmissionRoutes = require("../routes/assigmentSubmission.route");
const assignmentReviewRoutes = require("../routes/assigmentReview.route");
const engineerAssignBYAdminRoutes = require("../routes/engineerAssignBYAdmin.route");
const assignmentStartRoute = require("../routes/assignmentStart.route");
const profileRoutes = require("../routes/profile.route");

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
console.log("JWT_SECRET at startup:", process.env.JWT_SECRET);
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

app.use("/api/users", userRoutes);
app.use("/api/skills", candidateSkillRoutes);
app.use("/api/job-postings", jobPostRoutes);
app.use("/api/assignments", AssignmentRoutes);
app.use("/api/assignment/submissions", assignmentSubmissionRoutes);
app.use("/api/assignment-reviews", assignmentReviewRoutes);
app.use("/api/engineer-assignments", engineerAssignBYAdminRoutes);
app.use("/api/assignment/starts", assignmentStartRoute);
app.use("/api/profile", profileRoutes);

const PORT = process.env.PORT || 5100;

(async () => {
  try {
    await pool.query("SELECT 1");
    console.log(" PostgreSQL connected & verified");
  } catch (err) {
    console.error("PostgreSQL connection failed:", err.message);
    process.exit(1);
  }
})();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

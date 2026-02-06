// Catch any uncaught errors
process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION:", err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ UNHANDLED REJECTION at:", promise, "reason:", reason);
  process.exit(1);
});

try {
  require("dotenv").config();
} catch (e) {
  console.log("⚠️  dotenv not available or failed to load");
}

const express = require("express");
const cors = require("cors");

console.log("✓ Starting server initialization...");
console.log("✓ JWT_SECRET:", process.env.JWT_SECRET ? "SET" : "NOT SET");
console.log("✓ DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");

let pool;
try {
  pool = require("./db");
  console.log("✓ Database pool loaded successfully");
} catch (err) {
  console.error("❌ Error loading database pool:", err.message);
  process.exit(1);
}

let userRoutes, candidateSkillRoutes, jobPostRoutes, AssignmentRoutes;
let assignmentSubmissionRoutes,
  assignmentReviewRoutes,
  engineerAssignBYAdminRoutes;
let assignmentStartRoute, profileRoutes;

try {
  userRoutes = require("./routes/users.routes");
  candidateSkillRoutes = require("./routes/candidateSkill.routes");
  jobPostRoutes = require("./routes/jobPost.route");
  AssignmentRoutes = require("./routes/assignment.route");
  assignmentSubmissionRoutes = require("./routes/assigmentSubmission.route");
  assignmentReviewRoutes = require("./routes/assigmentReview.route");
  engineerAssignBYAdminRoutes = require("./routes/engineerAssignBYAdmin.route");
  assignmentStartRoute = require("./routes/assignmentStart.route");
  profileRoutes = require("./routes/profile.route");
  console.log("✓ All routes loaded successfully");
} catch (err) {
  console.error("❌ Error loading routes:", err.message);
  console.error(err.stack);
  process.exit(1);
}

const app = express();
console.log("✓ Express app created");

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
console.log("✓ CORS configured");

app.use(express.json());
console.log("✓ JSON parser configured");

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});
console.log("✓ Root route configured");

app.use("/api/users", userRoutes);
app.use("/api/skills", candidateSkillRoutes);
app.use("/api/job-postings", jobPostRoutes);
app.use("/api/assignments", AssignmentRoutes);
app.use("/api/assignment/submissions", assignmentSubmissionRoutes);
app.use("/api/assignment-reviews", assignmentReviewRoutes);
app.use("/api/engineer-assignments", engineerAssignBYAdminRoutes);
app.use("/api/assignment/starts", assignmentStartRoute);
app.use("/api/profile", profileRoutes);
console.log("✓ All routes registered");

const PORT = process.env.PORT || 5100;

(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("✓ PostgreSQL connected & verified");
  } catch (err) {
    console.error("⚠️  PostgreSQL connection failed:", err.message);
    console.warn("⚠️  Starting server anyway - check DATABASE_URL environment variable");
  }
})();

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
});

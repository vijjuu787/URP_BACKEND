// Global error handlers - catch any errors before startup
process.on("uncaughtException", (err) => {
  console.error("FATAL: Uncaught Exception:", err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("FATAL: Unhandled Rejection:", reason);
  process.exit(1);
});

// Load environment variables from .env (local development only)
try {
  require("dotenv").config();
} catch (e) {
  // dotenv not needed in production where env vars are set via platform
}

const express = require("express");
const cors = require("cors");

// Initialize Express app
const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "Server is running 🚀" });
});

// Import routes - these must not have side effects like process.exit()
let routes = {};
try {
  routes.users = require("./routes/users.routes");
  routes.skills = require("./routes/candidateSkill.routes");
  routes.jobPostings = require("./routes/jobPost.route");
  routes.assignments = require("./routes/assignment.route");
  routes.assignmentSubmissions = require("./routes/assigmentSubmission.route");
  routes.assignmentReviews = require("./routes/assigmentReview.route");
  routes.engineerAssignments = require("./routes/engineerAssignBYAdmin.route");
  routes.assignmentStarts = require("./routes/assignmentStart.route");
  routes.profile = require("./routes/profile.route");
} catch (err) {
  console.error("FATAL: Failed to load routes:", err.message);
  process.exit(1);
}

// Register routes
app.use("/api/users", routes.users);
app.use("/api/skills", routes.skills);
app.use("/api/job-postings", routes.jobPostings);
app.use("/api/assignments", routes.assignments);
app.use("/api/assignment/submissions", routes.assignmentSubmissions);
app.use("/api/assignment-reviews", routes.assignmentReviews);
app.use("/api/engineer-assignments", routes.engineerAssignments);
app.use("/api/assignment/starts", routes.assignmentStarts);
app.use("/api/profile", routes.profile);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Request error:", err.message);
  res.status(500).json({ error: "Internal Server Error" });
});

// Start server
const PORT = process.env.PORT || 5100;

app.listen(PORT, () => {
  console.log(`✓ Server is running on port ${PORT}`);
});

// Keep process alive
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

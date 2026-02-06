const { PrismaClient } = require("@prisma/client");
const { submissionExtension } = require("./middleware/submission.extension.js");
const {
  engineerAssignmentExtension,
} = require("./middleware/engeerierAssignment.extension.js");
const {
  assignmentReviewExtension,
} = require("./middleware/assignemtreview.extension.js");

const prisma = new PrismaClient()
  .$extends(assignmentReviewExtension)
  .$extends(engineerAssignmentExtension)
  .$extends(submissionExtension);

module.exports = { prisma };

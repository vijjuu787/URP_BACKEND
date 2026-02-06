const { Prisma } = require("@prisma/client");

const submissionExtension = Prisma.defineExtension({
  name: "submissionExtension",

  query: {
    assignmentSubmission: {
      async create({ args, query }) {
        args.data.submittedAt = new Date();
        return query(args);
      },
    },
  },
});

module.exports = { submissionExtension };

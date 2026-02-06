const { Prisma } = require("@prisma/client");

const assignmentReviewExtension = Prisma.defineExtension({
  name: "assignmentReviewExtension",

  query: {
    assignmentReview: {
      async create({ args, query }) {
        // auto set timestamps
        console.log(" EngineerAssignment CREATE extension fired");
        args.data.createdAt = new Date();

        return query(args);
      },

      async update({ args, query }) {
        args.data.updatedAt = new Date();

        return query(args);
      },
    },
  },
});

module.exports = { assignmentReviewExtension };

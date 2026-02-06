const { Prisma } = require("@prisma/client");

const engineerAssignmentExtension = Prisma.defineExtension({
  name: "engineerAssignmentExtension",

  query: {
    engineerAssignment: {
      async create({ args, query }) {
        // status already has default, no need to force
        console.log("Creating a new engineer assignment with data:", args.data);
        return query(args);
      },

      async update({ args, query }) {
        // example: enforce valid transitions
        if (args.data.status === "COMPLETED") {
          args.data.updatedAt = new Date();
        }

        return query(args);
      },
    },
  },
});

module.exports = { engineerAssignmentExtension };

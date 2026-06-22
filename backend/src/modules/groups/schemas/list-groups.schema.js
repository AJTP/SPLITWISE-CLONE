const { errorResponse } = require("../../../utils/schemas");
const groupSchema = require("./models/group.schema");

module.exports = {
  tags: ["Groups"],
  summary: "List user's groups",
  description: "Returns all groups the authenticated user belongs to.",
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      description: "List of groups",
      type: "array",
      items: groupSchema,
    },
    401: { description: "Unauthorized", ...errorResponse },
  },
};

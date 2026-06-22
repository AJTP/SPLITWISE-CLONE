const { errorResponse } = require("../../../utils/schemas");
const memberSchema = require("./models/member.schema");

module.exports = {
  tags: ["Groups"],
  summary: "List group members",
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", format: "uuid", description: "Group ID" },
    },
  },
  response: {
    200: {
      description: "List of group members",
      type: "array",
      items: memberSchema,
    },
    401: { description: "Unauthorized", ...errorResponse },
    403: { description: "Group not found or access denied", ...errorResponse },
  },
};

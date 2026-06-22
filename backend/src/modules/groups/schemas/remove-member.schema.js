const { errorResponse } = require("../../../utils/schemas");

module.exports = {
  tags: ["Groups"],
  summary: "Remove a member from a group",
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    required: ["id", "userId"],
    properties: {
      id: { type: "string", format: "uuid", description: "Group ID" },
      userId: {
        type: "string",
        format: "uuid",
        description: "User ID to remove",
      },
    },
  },
  response: {
    204: { description: "Member removed", type: "null" },
    401: { description: "Unauthorized", ...errorResponse },
    403: { description: "Group not found or access denied", ...errorResponse },
    404: { description: "Target user is not a member", ...errorResponse },
  },
};

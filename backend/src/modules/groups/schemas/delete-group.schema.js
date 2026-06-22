const { errorResponse } = require("../../../utils/schemas");

module.exports = {
  tags: ["Groups"],
  summary: "Delete a group",
  description: "Deletes the group and cascades to members and expenses.",
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", format: "uuid", description: "Group ID" },
    },
  },
  response: {
    204: { description: "Group deleted", type: "null" },
    401: { description: "Unauthorized", ...errorResponse },
    403: { description: "Group not found or access denied", ...errorResponse },
  },
};

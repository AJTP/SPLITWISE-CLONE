const { errorResponse } = require("../../../utils/schemas");

module.exports = {
  tags: ["Groups"],
  summary: "Generate group invite link",
  description:
    "Generates (or regenerates) a unique invite token for the group. Any group member can call this.",
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
      description: "Invite token generated",
      type: "object",
      properties: {
        inviteToken: { type: "string", format: "uuid" },
      },
    },
    401: { description: "Unauthorized", ...errorResponse },
    403: { description: "Group not found or access denied", ...errorResponse },
  },
};

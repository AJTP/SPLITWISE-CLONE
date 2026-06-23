const { errorResponse } = require("../../../utils/schemas");
const memberSchema = require("./models/member.schema");

module.exports = {
  tags: ["Groups"],
  summary: "Add a member to a group",
  description:
    "Add an existing user by userId, or create a guest slot by alias (for the invitation flow).",
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", format: "uuid", description: "Group ID" },
    },
  },
  body: {
    type: "object",
    properties: {
      userId: {
        type: "string",
        format: "uuid",
        description: "ID of an existing user to add directly",
      },
      alias: {
        type: "string",
        minLength: 1,
        maxLength: 100,
        description: "Display name for a guest participant",
      },
    },
    additionalProperties: false,
  },
  response: {
    201: { description: "Member added", ...memberSchema },
    400: { description: "Validation error", ...errorResponse },
    401: { description: "Unauthorized", ...errorResponse },
    403: { description: "Group not found or access denied", ...errorResponse },
    404: { description: "User not found", ...errorResponse },
    409: { description: "Alias or user already in group", ...errorResponse },
  },
};

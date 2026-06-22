const { errorResponse } = require("../../../utils/schemas");
const memberSchema = require("./models/member.schema");

module.exports = {
  tags: ["Groups"],
  summary: "Add a member to a group",
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
    required: ["userId"],
    properties: {
      userId: {
        type: "string",
        format: "uuid",
        description: "ID of the user to add",
      },
    },
    additionalProperties: false,
  },
  response: {
    201: { description: "Member added", ...memberSchema },
    400: { description: "Validation error", ...errorResponse },
    401: { description: "Unauthorized", ...errorResponse },
    403: { description: "Group not found or access denied", ...errorResponse },
    409: { description: "User is already a member", ...errorResponse },
  },
};

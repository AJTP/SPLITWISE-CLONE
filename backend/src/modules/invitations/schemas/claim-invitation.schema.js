const { errorResponse } = require("../../../utils/schemas");

module.exports = {
  tags: ["Invitations"],
  summary: "Claim a member alias",
  description:
    "Authenticated user claims an unclaimed alias in the group, linking their account to that participant slot.",
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    required: ["token"],
    properties: {
      token: { type: "string", format: "uuid" },
    },
  },
  body: {
    type: "object",
    required: ["memberId"],
    properties: {
      memberId: { type: "string", format: "uuid" },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        alias: { type: "string" },
        groupId: { type: "string", format: "uuid" },
        userId: { type: "string", format: "uuid" },
      },
    },
    400: { description: "Validation error", ...errorResponse },
    401: { description: "Unauthorized", ...errorResponse },
    404: { description: "Invalid token or member not found", ...errorResponse },
    409: {
      description: "Alias already claimed or user already in group",
      ...errorResponse,
    },
  },
};

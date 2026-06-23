const { errorResponse } = require("../../../utils/schemas");

module.exports = {
  tags: ["Invitations"],
  summary: "Get group info via invite token",
  description:
    "Public endpoint. Returns group details and list of unclaimed member aliases.",
  params: {
    type: "object",
    required: ["token"],
    properties: {
      token: { type: "string", format: "uuid" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        group: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            description: { type: ["string", "null"] },
          },
        },
        members: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              alias: { type: "string" },
              claimed: { type: "boolean" },
            },
          },
        },
      },
    },
    404: { description: "Invalid or expired invite token", ...errorResponse },
  },
};

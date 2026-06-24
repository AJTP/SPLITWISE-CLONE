const { errorResponse } = require("../../../utils/schemas");
const groupWithMembersSchema = require("./models/group-with-members.schema");

module.exports = {
  tags: ["Groups"],
  summary: "Create a new group",
  description:
    "Creates a group and automatically adds the creator plus any provided aliases as members.",
  security: [{ bearerAuth: [] }],
  body: {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string", minLength: 1 },
      description: { type: "string" },
      aliases: {
        type: "array",
        items: { type: "string", minLength: 1 },
      },
    },
    additionalProperties: false,
  },
  response: {
    201: { description: "Group created", ...groupWithMembersSchema },
    400: { description: "Validation error", ...errorResponse },
    401: { description: "Unauthorized", ...errorResponse },
  },
};

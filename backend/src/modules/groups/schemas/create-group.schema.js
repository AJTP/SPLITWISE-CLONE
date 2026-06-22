const { errorResponse } = require("../../../utils/schemas");
const groupSchema = require("./models/group.schema");

module.exports = {
  tags: ["Groups"],
  summary: "Create a new group",
  description:
    "Creates a group and automatically adds the creator as a member.",
  security: [{ bearerAuth: [] }],
  body: {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string", minLength: 1 },
      description: { type: "string" },
    },
    additionalProperties: false,
  },
  response: {
    201: { description: "Group created", ...groupSchema },
    400: { description: "Validation error", ...errorResponse },
    401: { description: "Unauthorized", ...errorResponse },
  },
};

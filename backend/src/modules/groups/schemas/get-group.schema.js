const { errorResponse } = require("../../../utils/schemas");
const groupSchema = require("./models/group.schema");

module.exports = {
  tags: ["Groups"],
  summary: "Get group by ID",
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", format: "uuid", description: "Group ID" },
    },
  },
  response: {
    200: { description: "Group found", ...groupSchema },
    401: { description: "Unauthorized", ...errorResponse },
    403: { description: "Group not found or access denied", ...errorResponse },
  },
};

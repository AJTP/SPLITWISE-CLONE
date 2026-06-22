const { errorResponse } = require("../../../utils/schemas");
const userSchema = require("./models/user.schema");

module.exports = {
  tags: ["Users"],
  summary: "Get user by ID",
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", format: "uuid", description: "User ID" },
    },
  },
  response: {
    200: { description: "User found", ...userSchema },
    401: { description: "Unauthorized", ...errorResponse },
    403: { description: "User not found or access denied", ...errorResponse },
  },
};

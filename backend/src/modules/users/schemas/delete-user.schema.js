const { errorResponse } = require("../../../utils/schemas");
const userSchema = require("./models/user.schema");

module.exports = {
  tags: ["Users"],
  summary: "Delete user by ID",
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", format: "uuid", description: "User ID" },
    },
  },
  response: {
    204: { description: "User deleted" },
    401: { description: "Unauthorized", ...errorResponse },
    403: { description: "User not found or access denied", ...errorResponse },
  },
};

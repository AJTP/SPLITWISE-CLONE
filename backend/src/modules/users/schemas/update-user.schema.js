const { errorResponse } = require("../../../utils/schemas");
const userSchema = require("./models/user.schema");

module.exports = {
  tags: ["Users"],
  summary: "Update an existing user",
  description: "Updates an existing user",
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", format: "uuid", description: "User ID" },
    },
  },
  body: {
    type: "object",
    required: ["name", "email"],
    properties: {
      name: { type: "string", minLength: 1 },
      email: { type: "string", format: "email" },
    },
    additionalProperties: false,
  },
  response: {
    200: { description: "User updated", ...userSchema },
    400: { description: "Validation error", ...errorResponse },
    401: { description: "Unauthorized", ...errorResponse },
  },
};

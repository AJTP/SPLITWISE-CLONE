const { errorResponse } = require("../../../utils/schemas");
const userSchema = require("./models/group.schema");

module.exports = {
  tags: ["Users"],
  summary: "Create a new user",
  description: "Creates a user",
  security: [{ bearerAuth: [] }],
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
    201: { description: "User created", ...userSchema },
    400: { description: "Validation error", ...errorResponse },
    401: { description: "Unauthorized", ...errorResponse },
  },
};

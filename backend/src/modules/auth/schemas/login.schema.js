const userResponse = require("./models/user.schema");
const { errorResponse } = require("../../../utils/schemas");

module.exports = {
  tags: ["Auth"],
  summary: "Login",
  description: "Authenticates a user and returns a JWT token.",
  body: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 1 },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      description: "Login successful",
      type: "object",
      properties: {
        token: { type: "string", description: "JWT access token" },
        user: userResponse,
      },
    },
    400: { description: "Validation error", ...errorResponse },
    401: { description: "Invalid credentials", ...errorResponse },
  },
};

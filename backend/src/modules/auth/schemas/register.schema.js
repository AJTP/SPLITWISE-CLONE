const userResponse = require("./models/user.schema");
const { errorResponse } = require("../../../utils/schemas");

module.exports = {
  tags: ["Auth"],
  summary: "Register a new user",
  description: "Creates a new user account and returns a JWT token.",
  body: {
    type: "object",
    required: ["name", "email", "password"],
    properties: {
      name: { type: "string", minLength: 1 },
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 8 },
    },
    additionalProperties: false,
  },
  response: {
    201: {
      description: "User registered successfully",
      type: "object",
      properties: {
        token: { type: "string", description: "JWT access token" },
        user: userResponse,
      },
    },
    400: { description: "Validation error", ...errorResponse },
    409: { description: "Email already in use", ...errorResponse },
  },
};

const errorResponse = {
  type: "object",
  properties: {
    statusCode: { type: "integer" },
    error: { type: "string" },
    message: { type: "string" },
  },
};

const userResponse = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    name: { type: "string" },
    email: { type: "string", format: "email" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const registerSchema = {
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

const loginSchema = {
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

module.exports = { registerSchema, loginSchema };

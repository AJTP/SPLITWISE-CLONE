const { errorResponse } = require("../../../utils/schemas");

module.exports = {
  tags: ["Settlements"],
  summary: "Register a payment between two group members",
  description:
    "Records that the payer has paid the payee a given amount within the group. " +
    "This reduces the payer's outstanding debt and the payee's outstanding credit " +
    "in the group balance calculation.",
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", format: "uuid", description: "Group ID" },
    },
  },
  body: {
    type: "object",
    required: ["payerId", "payeeId", "amount"],
    properties: {
      payerId: {
        type: "string",
        format: "uuid",
        description: "User making the payment",
      },
      payeeId: {
        type: "string",
        format: "uuid",
        description: "User receiving the payment",
      },
      amount: {
        type: "number",
        exclusiveMinimum: 0,
        description: "Amount paid",
      },
      notes: { type: "string", maxLength: 500 },
    },
    additionalProperties: false,
  },
  response: {
    201: {
      description: "Settlement created",
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        groupId: { type: "string", format: "uuid" },
        payerId: { type: "string", format: "uuid" },
        payeeId: { type: "string", format: "uuid" },
        amount: { type: "number" },
        notes: { type: ["string", "null"] },
        date: { type: "string", format: "date-time" },
        createdAt: { type: "string", format: "date-time" },
      },
    },
    400: { description: "Validation error", ...errorResponse },
    401: { description: "Unauthorized", ...errorResponse },
    403: { description: "Not a group member", ...errorResponse },
    422: {
      description: "Business rule violation (self-payment, non-member)",
      ...errorResponse,
    },
  },
};

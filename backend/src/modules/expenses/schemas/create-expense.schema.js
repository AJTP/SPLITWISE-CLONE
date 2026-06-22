const { errorResponse } = require("../../../utils/schemas");
const expenseSchema = require("./models/expense.schema");

const participantInput = {
  type: "object",
  required: ["userId"],
  properties: {
    userId: { type: "string", format: "uuid" },
    shareAmount: {
      type: "number",
      description: "Required when splitType is EXACT",
    },
    percentage: {
      type: "number",
      description: "Required when splitType is PERCENTAGE",
    },
  },
};

module.exports = {
  tags: ["Expenses"],
  summary: "Create an expense in a group",
  description:
    "Creates an expense and distributes shares among participants according to the splitType.",
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
    required: ["description", "amount", "participants"],
    properties: {
      description: { type: "string", minLength: 1 },
      amount: { type: "number", minimum: 0.01 },
      splitType: {
        type: "string",
        enum: ["EQUAL", "EXACT", "PERCENTAGE"],
        default: "EQUAL",
      },
      participants: {
        type: "array",
        minItems: 1,
        items: participantInput,
      },
    },
    additionalProperties: false,
  },
  response: {
    201: { description: "Expense created", ...expenseSchema },
    400: {
      description: "Validation error or invalid split amounts",
      ...errorResponse,
    },
    401: { description: "Unauthorized", ...errorResponse },
    403: { description: "Group not found or access denied", ...errorResponse },
  },
};

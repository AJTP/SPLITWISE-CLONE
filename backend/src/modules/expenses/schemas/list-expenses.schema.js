const { errorResponse } = require("../../../utils/schemas");
const expenseSchema = require("./models/expense.schema");

module.exports = {
  tags: ["Expenses"],
  summary: "List expenses in a group",
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", format: "uuid", description: "Group ID" },
    },
  },
  querystring: {
    type: "object",
    properties: {
      page: { type: "integer", minimum: 1, default: 1 },
      limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
    },
  },
  response: {
    200: {
      description: "List of expenses",
      type: "array",
      items: expenseSchema,
    },
    401: { description: "Unauthorized", ...errorResponse },
    403: { description: "Group not found or access denied", ...errorResponse },
  },
};

const { errorResponse } = require("../../../utils/schemas");
const expenseSchema = require("./models/expense.schema");

module.exports = {
  tags: ["Expenses"],
  summary: "Get expense by ID",
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", format: "uuid", description: "Expense ID" },
    },
  },
  response: {
    200: { description: "Expense found", ...expenseSchema },
    401: { description: "Unauthorized", ...errorResponse },
    403: { description: "Group not found or access denied", ...errorResponse },
    404: { description: "Expense not found", ...errorResponse },
  },
};

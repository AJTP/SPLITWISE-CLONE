const { errorResponse } = require("../../../utils/schemas");

const userBalance = {
  type: "object",
  properties: {
    userId: { type: "string", format: "uuid" },
    userName: { type: "string" },
    userEmail: { type: "string" },
    amount: {
      type: "number",
      description:
        "Net balance. Positive = is owed money. Negative = owes money.",
    },
  },
};

const debtTransaction = {
  type: "object",
  properties: {
    fromUserId: { type: "string", format: "uuid" },
    fromUserName: { type: "string" },
    fromUserEmail: { type: "string" },
    toUserId: { type: "string", format: "uuid" },
    toUserName: { type: "string" },
    toUserEmail: { type: "string" },
    amount: { type: "number", description: "Amount to transfer" },
  },
};

module.exports = {
  tags: ["Balances"],
  summary: "Get balance summary and simplified debts for a group",
  description:
    "Returns the net balance per member and a simplified list of debt transactions " +
    "using the minimum number of payments. Debts are computed on-the-fly from " +
    "group expenses using a greedy algorithm.",
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", format: "uuid", description: "Group ID" },
    },
  },
  response: {
    200: {
      description: "Balance summary and simplified debts",
      type: "object",
      properties: {
        balances: {
          type: "array",
          description: "Net balance for every group member",
          items: userBalance,
        },
        simplifiedDebts: {
          type: "array",
          description: "Minimum set of transactions that settle all debts",
          items: debtTransaction,
        },
      },
    },
    401: { description: "Unauthorized", ...errorResponse },
    403: { description: "Group not found or access denied", ...errorResponse },
  },
};

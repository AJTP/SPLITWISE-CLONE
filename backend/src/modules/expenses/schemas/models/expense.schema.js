module.exports = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    description: { type: "string" },
    amount: { type: "string", description: "Decimal amount as string" },
    date: { type: "string", format: "date-time" },
    groupId: { type: "string", format: "uuid" },
    paidById: { type: "string", format: "uuid" },
    paidBy: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        name: { type: "string" },
        email: { type: "string", format: "email" },
      },
    },
    participants: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          shareAmount: { type: "string" },
          splitType: { type: "string", enum: ["EQUAL", "EXACT", "PERCENTAGE"] },
          user: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string" },
              email: { type: "string", format: "email" },
            },
          },
        },
      },
    },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

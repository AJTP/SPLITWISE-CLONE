module.exports = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    groupId: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    createdAt: { type: "string", format: "date-time" },
    user: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        name: { type: "string" },
        email: { type: "string", format: "email" },
      },
    },
  },
};

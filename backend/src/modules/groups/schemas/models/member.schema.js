module.exports = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    groupId: { type: "string", format: "uuid" },
    userId: { type: ["string", "null"], format: "uuid" },
    alias: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    user: {
      type: ["object", "null"],
      properties: {
        id: { type: "string", format: "uuid" },
        name: { type: "string" },
        email: { type: "string", format: "email" },
      },
    },
  },
};

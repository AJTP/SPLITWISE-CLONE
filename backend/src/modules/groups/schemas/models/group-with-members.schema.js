const groupSchema = require("./group.schema");
const memberSchema = require("./member.schema");

module.exports = {
  type: "object",
  properties: {
    ...groupSchema.properties,
    members: {
      type: "array",
      items: memberSchema,
    },
  },
};

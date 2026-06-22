const { errorResponse } = require("../../../utils/schemas");
const userSchema = require("./models/user.schema");

module.exports = {
  tags: ["Users"],
  summary: "List users",
  description: "Returns all users.",
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      description: "List of users",
      type: "array",
      items: userSchema,
    },
    401: { description: "Unauthorized", ...errorResponse },
  },
};

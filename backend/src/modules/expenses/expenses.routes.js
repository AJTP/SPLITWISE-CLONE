const authMiddleware = require("../../middlewares/auth.middleware");
const expensesController = require("./expenses.controller");
const { getExpenseSchema } = require("./schemas");

async function plugin(fastify, opts) {
  fastify.get(
    "/:id",
    { preHandler: [authMiddleware], schema: getExpenseSchema },
    expensesController.getOne,
  );
}

module.exports = plugin;

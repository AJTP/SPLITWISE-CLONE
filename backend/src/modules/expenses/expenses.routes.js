const expensesController = require("./expenses.controller");

async function plugin(fastify, opts) {
  fastify.get("/", expensesController.list);
  fastify.get("/:id", expensesController.getOne);
  fastify.post("/", expensesController.create);
  fastify.put("/:id", expensesController.update);
  fastify.delete("/:id", expensesController.remove);
}

module.exports = plugin;

const settlementsController = require("./settlements.controller");

async function plugin(fastify, opts) {
  fastify.get("/", settlementsController.list);
  fastify.get("/:id", settlementsController.getOne);
  fastify.post("/", settlementsController.create);
  fastify.delete("/:id", settlementsController.remove);
}

module.exports = plugin;

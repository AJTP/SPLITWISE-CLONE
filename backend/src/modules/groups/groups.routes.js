const groupsController = require("./groups.controller");

async function plugin(fastify, opts) {
  fastify.get("/", groupsController.list);
  fastify.get("/:id", groupsController.getOne);
  fastify.post("/", groupsController.create);
  fastify.put("/:id", groupsController.update);
  fastify.delete("/:id", groupsController.remove);
}

module.exports = plugin;

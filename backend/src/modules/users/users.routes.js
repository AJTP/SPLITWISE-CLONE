const usersController = require("./users.controller");

async function plugin(fastify, opts) {
  fastify.get("/", usersController.list);
  fastify.get("/:id", usersController.getOne);
  fastify.post("/", usersController.create);
  fastify.put("/:id", usersController.update);
  fastify.delete("/:id", usersController.remove);
}

module.exports = plugin;

const authController = require("./auth.controller");

async function plugin(fastify, opts) {
  fastify.post("/register", authController.register);
  fastify.post("/login", authController.login);
}

module.exports = plugin;

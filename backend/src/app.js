const fastify = require("fastify")({
  logger: false, // silenciar logs en tests
});

fastify.get("/", async (request, reply) => {
  return { hello: "mundo" };
});

module.exports = fastify;

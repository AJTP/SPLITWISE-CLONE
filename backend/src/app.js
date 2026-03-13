const fastify = require("fastify")({
  logger: false, // silenciar logs en tests
});

fastify.get("/health", async (request, reply) => {
  return { status: "ok" };
});

module.exports = fastify;

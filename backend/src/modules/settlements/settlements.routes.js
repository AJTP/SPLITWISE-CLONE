// Standalone settlement routes (mounted at /settlements)
// Nested group routes (POST /groups/:id/settlements) live in groups.routes.js
const settlementsController = require("./settlements.controller");

async function plugin(fastify, opts) {
  // Tarea 14 — list and get by id
  fastify.get("/", settlementsController.list);
  fastify.get("/:id", settlementsController.getOne);
}

module.exports = plugin;

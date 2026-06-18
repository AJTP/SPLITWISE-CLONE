const balancesController = require("./balances.controller");

async function plugin(fastify, opts) {
  fastify.get("/:groupId", balancesController.getByGroup);
}

module.exports = plugin;

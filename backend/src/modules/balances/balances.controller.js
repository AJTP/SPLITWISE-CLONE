const balancesService = require("./balances.service");

async function getByGroup(request, reply) {
  const result = await balancesService.getGroupBalances(
    request.params.id,
    request.user.userId,
  );
  return reply.code(200).send(result);
}

module.exports = { getByGroup };

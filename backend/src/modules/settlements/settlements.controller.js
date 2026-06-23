const settlementsService = require("./settlements.service");

async function create(request, reply) {
  const result = await settlementsService.create(
    request.params.id,
    request.body,
    request.user.userId,
  );
  return reply.code(201).send(result);
}

// Stubs — implemented in Tarea 14
async function list(request, reply) {
  return reply.code(501).send({ message: "not implemented" });
}

async function getOne(request, reply) {
  return reply.code(501).send({ message: "not implemented" });
}

async function remove(request, reply) {
  return reply.code(501).send({ message: "not implemented" });
}

module.exports = { create, list, getOne, remove };

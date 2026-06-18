async function list(request, reply) {
  return reply.code(501).send({ message: "not implemented" });
}

async function getOne(request, reply) {
  return reply.code(501).send({ message: "not implemented" });
}

async function create(request, reply) {
  return reply.code(501).send({ message: "not implemented" });
}

async function remove(request, reply) {
  return reply.code(501).send({ message: "not implemented" });
}

module.exports = { list, getOne, create, remove };

async function register(request, reply) {
  return reply.code(501).send({ message: "not implemented" });
}

async function login(request, reply) {
  return reply.code(501).send({ message: "not implemented" });
}

module.exports = { register, login };

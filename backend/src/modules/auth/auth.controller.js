const authService = require("./auth.service");

async function register(request, reply) {
  const result = await authService.register(request.body);
  return reply.code(201).send(result);
}

async function login(request, reply) {
  const result = await authService.login(request.body);
  return reply.code(200).send(result);
}

module.exports = { register, login };

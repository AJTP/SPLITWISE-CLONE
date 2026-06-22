const usersService = require("./users.service");

async function list(request, reply) {
  const users = await usersService.listUsers();
  return reply.code(200).send(users);
}

async function getOne(request, reply) {
  const user = await usersService.getUser(request.params.id);
  return reply.code(200).send(user);
}

async function create(request, reply) {
  const user = await usersService.createUser(request.body);
  return reply.code(201).send(user);
}

async function update(request, reply) {
  return reply.code(501).send({ message: "not implemented" });
}

async function remove(request, reply) {
  return reply.code(501).send({ message: "not implemented" });
}

module.exports = { list, getOne, create, update, remove };

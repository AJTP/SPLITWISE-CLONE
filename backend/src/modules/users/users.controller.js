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
  const user = await usersService.updateUser(request.params.id, request.body);
  return reply.code(200).send(user);
}

async function remove(request, reply) {
  await usersService.removeUser(request.params.id);
  return reply.code(204).send();
}

module.exports = { list, getOne, create, update, remove };

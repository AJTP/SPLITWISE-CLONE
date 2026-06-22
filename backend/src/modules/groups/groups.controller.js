const groupsService = require("./groups.service");

async function list(request, reply) {
  const groups = await groupsService.listGroups(request.user.userId);
  return reply.code(200).send(groups);
}

async function getOne(request, reply) {
  const group = await groupsService.getGroup(
    request.params.id,
    request.user.userId,
  );
  return reply.code(200).send(group);
}

async function create(request, reply) {
  const group = await groupsService.createGroup(
    request.body,
    request.user.userId,
  );
  return reply.code(201).send(group);
}

async function remove(request, reply) {
  await groupsService.deleteGroup(request.params.id, request.user.userId);
  return reply.code(204).send();
}

async function addMember(request, reply) {
  const member = await groupsService.addMember(
    request.params.id,
    request.body.userId,
    request.user.userId,
  );
  return reply.code(201).send(member);
}

async function listMembers(request, reply) {
  const members = await groupsService.listMembers(
    request.params.id,
    request.user.userId,
  );
  return reply.code(200).send(members);
}

async function removeMember(request, reply) {
  await groupsService.removeMember(
    request.params.id,
    request.params.userId,
    request.user.userId,
  );
  return reply.code(204).send();
}

module.exports = {
  list,
  getOne,
  create,
  remove,
  addMember,
  listMembers,
  removeMember,
};

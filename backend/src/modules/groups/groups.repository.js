const prisma = require("../../utils/prisma");

async function findAllByUserId(userId) {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: { group: true },
  });
  return memberships.map((m) => m.group);
}

async function findById(groupId) {
  return prisma.group.findUnique({ where: { id: groupId } });
}

async function isMember(groupId, userId) {
  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
  return Boolean(membership);
}

async function create({ name, description }) {
  return prisma.group.create({ data: { name, description } });
}

async function remove(groupId) {
  return prisma.group.delete({ where: { id: groupId } });
}

async function addMember(groupId, userId) {
  return prisma.groupMember.create({ data: { groupId, userId } });
}

async function findMembers(groupId) {
  return prisma.groupMember.findMany({
    where: { groupId },
    include: {
      user: { select: { id: true, name: true, email: true, createdAt: true } },
    },
  });
}

async function removeMember(groupId, userId) {
  return prisma.groupMember.delete({
    where: { userId_groupId: { userId, groupId } },
  });
}

module.exports = {
  findAllByUserId,
  findById,
  isMember,
  create,
  remove,
  addMember,
  findMembers,
  removeMember,
};

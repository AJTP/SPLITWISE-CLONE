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

async function findUserById(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });
}

// userId is nullable now → use findFirst
async function isMember(groupId, userId) {
  if (!userId) return false;
  const membership = await prisma.groupMember.findFirst({
    where: { groupId, userId },
  });
  return Boolean(membership);
}

async function findMemberByAlias(groupId, alias) {
  return prisma.groupMember.findUnique({
    where: { alias_groupId: { alias, groupId } },
  });
}

async function create({ name, description }) {
  return prisma.group.create({ data: { name, description } });
}

/**
 * Creates a group together with all its initial members in a single transaction.
 * @param {{ name: string, description?: string }} groupData
 * @param {{ userId: string, alias: string }} creator
 * @param {string[]} aliases  - additional guest aliases
 * @returns {Promise<Group & { members: GroupMember[] }>}
 */
async function createWithMembers(groupData, creator, aliases) {
  return prisma.$transaction(async (tx) => {
    const group = await tx.group.create({ data: groupData });

    const membersToCreate = [
      { groupId: group.id, userId: creator.userId, alias: creator.alias },
      ...aliases.map((alias) => ({ groupId: group.id, userId: null, alias })),
    ];

    await tx.groupMember.createMany({ data: membersToCreate });

    const members = await tx.groupMember.findMany({
      where: { groupId: group.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return { ...group, members };
  });
}

async function remove(groupId) {
  return prisma.group.delete({ where: { id: groupId } });
}

async function addMember(groupId, { userId = null, alias }) {
  return prisma.groupMember.create({ data: { groupId, userId, alias } });
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
  const member = await prisma.groupMember.findFirst({
    where: { groupId, userId },
  });
  if (!member) return null;
  return prisma.groupMember.delete({ where: { id: member.id } });
}

async function setInviteToken(groupId, token) {
  return prisma.group.update({
    where: { id: groupId },
    data: { inviteToken: token },
  });
}

async function findGroupByInviteToken(token) {
  return prisma.group.findUnique({
    where: { inviteToken: token },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
}

module.exports = {
  findAllByUserId,
  findById,
  findUserById,
  isMember,
  findMemberByAlias,
  create,
  createWithMembers,
  remove,
  addMember,
  findMembers,
  removeMember,
  setInviteToken,
  findGroupByInviteToken,
};

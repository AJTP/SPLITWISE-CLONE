const prisma = require("../../utils/prisma");

async function findGroupByInviteToken(token) {
  return prisma.group.findUnique({
    where: { inviteToken: token },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

async function findMemberById(memberId) {
  return prisma.groupMember.findUnique({ where: { id: memberId } });
}

async function isUserAlreadyMember(groupId, userId) {
  const m = await prisma.groupMember.findFirst({ where: { groupId, userId } });
  return Boolean(m);
}

async function claimMember(memberId, userId) {
  return prisma.groupMember.update({
    where: { id: memberId },
    data: { userId },
  });
}

module.exports = {
  findGroupByInviteToken,
  findMemberById,
  isUserAlreadyMember,
  claimMember,
};

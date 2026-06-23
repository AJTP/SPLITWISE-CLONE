const prisma = require("../../utils/prisma");

async function findExpensesWithParticipants(groupId) {
  return prisma.expense.findMany({
    where: { groupId },
    select: {
      paidById: true,
      participants: {
        select: { userId: true, shareAmount: true },
      },
    },
  });
}

async function findGroupMembers(groupId) {
  return prisma.groupMember.findMany({
    where: { groupId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

async function findSettlementsByGroup(groupId) {
  return prisma.settlement.findMany({
    where: { groupId },
    select: { payerId: true, payeeId: true, amount: true },
  });
}

module.exports = {
  findExpensesWithParticipants,
  findGroupMembers,
  findSettlementsByGroup,
};

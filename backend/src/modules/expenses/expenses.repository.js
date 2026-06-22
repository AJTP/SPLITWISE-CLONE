const prisma = require("../../utils/prisma");

const participantInclude = {
  user: { select: { id: true, name: true, email: true } },
};

async function findAllByGroupId(groupId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  return prisma.expense.findMany({
    where: { groupId },
    skip,
    take: limit,
    orderBy: { date: "desc" },
    include: {
      paidBy: { select: { id: true, name: true, email: true } },
      participants: { include: participantInclude },
    },
  });
}

async function findById(expenseId) {
  return prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      paidBy: { select: { id: true, name: true, email: true } },
      participants: { include: participantInclude },
    },
  });
}

async function create({
  groupId,
  paidById,
  description,
  amount,
  participants,
}) {
  return prisma.expense.create({
    data: {
      description,
      amount,
      groupId,
      paidById,
      participants: {
        create: participants.map(({ userId, shareAmount, splitType }) => ({
          userId,
          shareAmount,
          splitType,
        })),
      },
    },
    include: {
      paidBy: { select: { id: true, name: true, email: true } },
      participants: { include: participantInclude },
    },
  });
}

module.exports = { findAllByGroupId, findById, create };

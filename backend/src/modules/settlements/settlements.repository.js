const prisma = require("../../utils/prisma");

const SELECT_FIELDS = {
  id: true,
  groupId: true,
  payerId: true,
  payeeId: true,
  amount: true,
  notes: true,
  date: true,
  createdAt: true,
};

async function findByGroup(groupId) {
  return prisma.settlement.findMany({
    where: { groupId },
    orderBy: { date: "desc" },
    select: SELECT_FIELDS,
  });
}

async function findById(id) {
  return prisma.settlement.findUnique({
    where: { id },
    select: SELECT_FIELDS,
  });
}

async function create(data) {
  return prisma.settlement.create({
    data,
    select: SELECT_FIELDS,
  });
}

async function remove(id) {
  return prisma.settlement.delete({ where: { id } });
}

module.exports = { findByGroup, findById, create, remove };

const prisma = require("../../utils/prisma");

async function findAll() {
  const users = await prisma.user.findMany();
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));
}

async function findById(id) {
  return prisma.user.findUnique({ where: { id } });
}

async function create({ name, email, password }) {
  return prisma.user.create({ data: { name, email, password } });
}

async function update(id, { name, email }) {
  return prisma.user.update({ where: { id }, data: { name, email } });
}

async function remove(id) {
  return prisma.user.delete({ where: { id } });
}

module.exports = { findAll, findById, create, update, remove };

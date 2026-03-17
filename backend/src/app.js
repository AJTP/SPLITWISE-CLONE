const fastify = require("fastify")({
  logger: process.env.NODE_ENV !== "test",
});

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Middleware para cerrar la conexión de Prisma al cerrar la app
fastify.addHook("onClose", async (instance) => {
  await prisma.$disconnect();
});

fastify.get("/health", async (request, reply) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ok", database: "connected" };
  } catch (error) {
    return { status: "error", database: "disconnected", error: error.message };
  }
});

// Ruta básica para listar usuarios
fastify.get("/users", async (request, reply) => {
  try {
    const users = await prisma.user.findMany();
    return users;
  } catch (error) {
    reply.code(500).send({ error: error.message });
  }
});

// Ruta básica para listar grupos
fastify.get("/groups", async (request, reply) => {
  try {
    const groups = await prisma.group.findMany();
    return groups;
  } catch (error) {
    reply.code(500).send({ error: error.message });
  }
});

// Ruta básica para listar gastos
fastify.get("/expenses", async (request, reply) => {
  try {
    const expenses = await prisma.expense.findMany();
    return expenses;
  } catch (error) {
    reply.code(500).send({ error: error.message });
  }
});

module.exports = fastify;

const fastify = require("fastify")({
  logger: process.env.NODE_ENV !== "test",
});

const prisma = require("./utils/prisma");

const authRoutes = require("./modules/auth/auth.routes");
const usersRoutes = require("./modules/users/users.routes");
const groupsRoutes = require("./modules/groups/groups.routes");
const expensesRoutes = require("./modules/expenses/expenses.routes");
const settlementsRoutes = require("./modules/settlements/settlements.routes");
const balancesRoutes = require("./modules/balances/balances.routes");

// Close Prisma on app shutdown
fastify.addHook("onClose", async (instance) => {
  await prisma.$disconnect();
});

// Global error handler
fastify.setErrorHandler((error, request, reply) => {
  const statusCode = error.statusCode ?? 500;
  reply.code(statusCode).send({
    statusCode,
    error: error.name,
    message: error.message,
  });
});

// Health check
fastify.get("/health", async (request, reply) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ok", database: "connected" };
  } catch (error) {
    return { status: "error", database: "disconnected", error: error.message };
  }
});

// Module routes
fastify.register(authRoutes, { prefix: "/auth" });
fastify.register(usersRoutes, { prefix: "/users" });
fastify.register(groupsRoutes, { prefix: "/groups" });
fastify.register(expensesRoutes, { prefix: "/expenses" });
fastify.register(settlementsRoutes, { prefix: "/settlements" });
fastify.register(balancesRoutes, { prefix: "/balances" });

module.exports = fastify;

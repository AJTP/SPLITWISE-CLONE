const fastify = require("fastify")({
  logger: process.env.NODE_ENV !== "test",
});
const options = require("./options");
const prisma = require("./utils/prisma");

const authRoutes = require("./modules/auth/auth.routes");
const usersRoutes = require("./modules/users/users.routes");
const groupsRoutes = require("./modules/groups/groups.routes");
const expensesRoutes = require("./modules/expenses/expenses.routes");
const settlementsRoutes = require("./modules/settlements/settlements.routes");

// ── Swagger / OpenAPI ────────────────────────────────────────────────────────
fastify.register(require("@fastify/swagger"), options.swagger);
if (process.env.NODE_ENV !== "test") {
  fastify.register(require("@scalar/fastify-api-reference"), options.scalar);
}

// ── Hooks ────────────────────────────────────────────────────────────────────
fastify.addHook("onClose", async (instance) => {
  await prisma.$disconnect();
});

// ── Error handler ────────────────────────────────────────────────────────────
const errorHandler = require("./middlewares/error.handler");
fastify.setErrorHandler(errorHandler);

// ── Module routes ─────────────────────────────────────────────────────────────
fastify.register(authRoutes, { prefix: "/auth" });
fastify.register(usersRoutes, { prefix: "/users" });
fastify.register(groupsRoutes, { prefix: "/groups" });
fastify.register(expensesRoutes, { prefix: "/expenses" });
fastify.register(settlementsRoutes, { prefix: "/settlements" });

module.exports = fastify;

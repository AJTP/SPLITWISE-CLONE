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

// ── Swagger / OpenAPI ────────────────────────────────────────────────────────
fastify.register(require("@fastify/swagger"), {
  openapi: {
    openapi: "3.0.3",
    info: {
      title: "Splitwise Clone API",
      description:
        "REST API for shared expense management. Supports groups, expenses, debt calculation and settlements.",
      version: "1.0.0",
    },
    servers: [
      { url: "http://localhost:4000", description: "Local development" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token obtained from POST /auth/login",
        },
      },
    },
    tags: [
      { name: "Health", description: "Service health check" },
      { name: "Auth", description: "User registration and login" },
      { name: "Users", description: "User management" },
      { name: "Groups", description: "Expense group management" },
      { name: "Expenses", description: "Expense tracking within groups" },
      { name: "Settlements", description: "Payment settlements between users" },
      { name: "Balances", description: "Balance and debt calculations" },
    ],
  },
});

fastify.register(require("@scalar/fastify-api-reference"), {
  routePrefix: "/docs",
  configuration: {
    title: "Splitwise Clone API",
    theme: "default",
  },
});

// ── Hooks ────────────────────────────────────────────────────────────────────
fastify.addHook("onClose", async (instance) => {
  await prisma.$disconnect();
});

// ── Error handler ────────────────────────────────────────────────────────────
fastify.setErrorHandler((error, request, reply) => {
  const statusCode = error.statusCode ?? 500;
  reply.code(statusCode).send({
    statusCode,
    error: error.name,
    message: error.message,
  });
});

// ── Health check ─────────────────────────────────────────────────────────────
fastify.get(
  "/health",
  {
    schema: {
      tags: ["Health"],
      summary: "Check service and database health",
      response: {
        200: {
          description: "Service is healthy",
          type: "object",
          properties: {
            status: { type: "string", example: "ok" },
            database: { type: "string", example: "connected" },
          },
        },
      },
    },
  },
  async (request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: "ok", database: "connected" };
    } catch (error) {
      return {
        status: "error",
        database: "disconnected",
        error: error.message,
      };
    }
  },
);

// ── Module routes ─────────────────────────────────────────────────────────────
fastify.register(authRoutes, { prefix: "/auth" });
fastify.register(usersRoutes, { prefix: "/users" });
fastify.register(groupsRoutes, { prefix: "/groups" });
fastify.register(expensesRoutes, { prefix: "/expenses" });
fastify.register(settlementsRoutes, { prefix: "/settlements" });
fastify.register(balancesRoutes, { prefix: "/balances" });

module.exports = fastify;

module.exports = {
  swagger: {
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
        {
          name: "Settlements",
          description: "Payment settlements between users",
        },
        { name: "Balances", description: "Balance and debt calculations" },
      ],
    },
  },
  scalar: {
    routePrefix: "/docs",
    configuration: {
      title: "Splitwise Clone API",
      theme: "default",
    },
  },
};

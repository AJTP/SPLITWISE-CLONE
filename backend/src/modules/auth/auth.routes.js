const authController = require("./auth.controller");
const { registerSchema, loginSchema } = require("./auth.schema");

async function plugin(fastify, opts) {
  fastify.post(
    "/register",
    { schema: registerSchema },
    authController.register,
  );
  fastify.post("/login", { schema: loginSchema }, authController.login);
}

module.exports = plugin;

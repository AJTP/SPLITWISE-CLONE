const authMiddleware = require("../../middlewares/auth.middleware");
const usersController = require("./users.controller");

const {
  listUsersSchema,
  getUserSchema,
  createUserSchema,
  updateUserSchema,
  deleteUserSchema,
} = require("./schemas");

async function plugin(fastify, opts) {
  fastify.get(
    "/",
    { preHandler: [authMiddleware], schema: listUsersSchema },
    usersController.list,
  );
  fastify.get(
    "/:id",
    { preHandler: [authMiddleware], schema: getUserSchema },
    usersController.getOne,
  );
  fastify.post(
    "/",
    { preHandler: [authMiddleware], schema: createUserSchema },
    usersController.create,
  );
  fastify.put(
    "/:id",
    { preHandler: [authMiddleware], schema: updateUserSchema },
    usersController.update,
  );
  fastify.delete(
    "/:id",
    { preHandler: [authMiddleware], schema: deleteUserSchema },
    usersController.remove,
  );
}

module.exports = plugin;

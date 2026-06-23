const adminMiddleware = require("../../middlewares/admin.middleware");
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
    { preHandler: [adminMiddleware], schema: listUsersSchema },
    usersController.list,
  );
  fastify.get(
    "/:id",
    { preHandler: [adminMiddleware], schema: getUserSchema },
    usersController.getOne,
  );
  fastify.post(
    "/",
    { preHandler: [adminMiddleware], schema: createUserSchema },
    usersController.create,
  );
  fastify.put(
    "/:id",
    { preHandler: [adminMiddleware], schema: updateUserSchema },
    usersController.update,
  );
  fastify.delete(
    "/:id",
    { preHandler: [adminMiddleware], schema: deleteUserSchema },
    usersController.remove,
  );
}

module.exports = plugin;

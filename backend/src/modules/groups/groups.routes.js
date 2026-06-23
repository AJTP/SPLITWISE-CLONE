const authMiddleware = require("../../middlewares/auth.middleware");
const groupsController = require("./groups.controller");
const expensesController = require("../expenses/expenses.controller");
const balancesController = require("../balances/balances.controller");
const settlementsController = require("../settlements/settlements.controller");

const {
  listGroupsSchema,
  getGroupSchema,
  createGroupSchema,
  deleteGroupSchema,
  addMemberSchema,
  listMembersSchema,
  removeMemberSchema,
} = require("./schemas");

const {
  createExpenseSchema,
  listExpensesSchema,
} = require("../expenses/schemas");

const { getGroupBalancesSchema } = require("../balances/schemas");
const { createSettlementSchema } = require("../settlements/schemas");

async function plugin(fastify, opts) {
  fastify.get(
    "/",
    { preHandler: [authMiddleware], schema: listGroupsSchema },
    groupsController.list,
  );
  fastify.get(
    "/:id",
    { preHandler: [authMiddleware], schema: getGroupSchema },
    groupsController.getOne,
  );
  fastify.post(
    "/",
    { preHandler: [authMiddleware], schema: createGroupSchema },
    groupsController.create,
  );
  fastify.delete(
    "/:id",
    { preHandler: [authMiddleware], schema: deleteGroupSchema },
    groupsController.remove,
  );

  // Members routes
  fastify.post(
    "/:id/members",
    { preHandler: [authMiddleware], schema: addMemberSchema },
    groupsController.addMember,
  );
  fastify.get(
    "/:id/members",
    { preHandler: [authMiddleware], schema: listMembersSchema },
    groupsController.listMembers,
  );
  fastify.delete(
    "/:id/members/:userId",
    { preHandler: [authMiddleware], schema: removeMemberSchema },
    groupsController.removeMember,
  );

  // Expenses routes
  fastify.post(
    "/:id/expenses",
    { preHandler: [authMiddleware], schema: createExpenseSchema },
    expensesController.createForGroup,
  );
  fastify.get(
    "/:id/expenses",
    { preHandler: [authMiddleware], schema: listExpensesSchema },
    expensesController.listForGroup,
  );

  // Balances routes
  fastify.get(
    "/:id/balances",
    { preHandler: [authMiddleware], schema: getGroupBalancesSchema },
    balancesController.getByGroup,
  );

  // Settlements routes
  fastify.post(
    "/:id/settlements",
    { preHandler: [authMiddleware], schema: createSettlementSchema },
    settlementsController.create,
  );
}

module.exports = plugin;

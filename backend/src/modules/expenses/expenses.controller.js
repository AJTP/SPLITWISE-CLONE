const expensesService = require("./expenses.service");

async function createForGroup(request, reply) {
  const expense = await expensesService.createExpense(
    request.params.id,
    request.body,
    request.user.userId,
  );
  return reply.code(201).send(expense);
}

async function listForGroup(request, reply) {
  const { page = 1, limit = 20 } = request.query;
  const expenses = await expensesService.listExpenses(
    request.params.id,
    request.user.userId,
    { page: Number(page), limit: Number(limit) },
  );
  return reply.code(200).send(expenses);
}

async function getOne(request, reply) {
  const expense = await expensesService.getExpense(
    request.params.id,
    request.user.userId,
  );
  return reply.code(200).send(expense);
}

module.exports = { createForGroup, listForGroup, getOne };

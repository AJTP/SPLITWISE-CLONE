const expensesRepository = require("./expenses.repository");
const groupsRepository = require("../groups/groups.repository");

function notMemberError() {
  const err = new Error("Group not found or access denied");
  err.statusCode = 403;
  return err;
}

/**
 * Pure function — exported for unit testing without DB.
 * Distributes expense amount among participants according to splitType.
 */
function calculateShares(amount, participants, splitType) {
  if (splitType === "EQUAL") {
    const n = participants.length;
    const base = Math.floor((amount * 100) / n) / 100;
    const remainder = Math.round((amount - base * n) * 100) / 100;
    return participants.map((p, i) => ({
      userId: p.userId,
      shareAmount: i === 0 ? base + remainder : base,
      splitType,
    }));
  }

  if (splitType === "EXACT") {
    const sum = participants.reduce((acc, p) => acc + Number(p.shareAmount), 0);
    if (Math.abs(sum - Number(amount)) > 0.01) {
      const err = new Error(
        `Share amounts sum (${sum.toFixed(2)}) must equal expense amount (${amount})`,
      );
      err.statusCode = 400;
      throw err;
    }
    return participants.map((p) => ({
      userId: p.userId,
      shareAmount: Number(p.shareAmount),
      splitType,
    }));
  }

  if (splitType === "PERCENTAGE") {
    const sumPct = participants.reduce(
      (acc, p) => acc + Number(p.percentage),
      0,
    );
    if (Math.abs(sumPct - 100) > 0.01) {
      const err = new Error(`Percentages must sum to 100 (got ${sumPct})`);
      err.statusCode = 400;
      throw err;
    }
    return participants.map((p) => ({
      userId: p.userId,
      shareAmount:
        Math.round(((Number(amount) * Number(p.percentage)) / 100) * 100) / 100,
      splitType,
    }));
  }

  const err = new Error(`Invalid splitType: ${splitType}`);
  err.statusCode = 400;
  throw err;
}

async function createExpense(
  groupId,
  { description, amount, splitType = "EQUAL", participants },
  userId,
) {
  const member = await groupsRepository.isMember(groupId, userId);
  if (!member) throw notMemberError();

  const shares = calculateShares(amount, participants, splitType);

  return expensesRepository.create({
    groupId,
    paidById: userId,
    description,
    amount,
    participants: shares,
  });
}

async function listExpenses(groupId, userId, pagination) {
  const member = await groupsRepository.isMember(groupId, userId);
  if (!member) throw notMemberError();
  return expensesRepository.findAllByGroupId(groupId, pagination);
}

async function getExpense(expenseId, userId) {
  const expense = await expensesRepository.findById(expenseId);
  if (!expense) {
    const err = new Error("Expense not found");
    err.statusCode = 404;
    throw err;
  }
  const member = await groupsRepository.isMember(expense.groupId, userId);
  if (!member) throw notMemberError();
  return expense;
}

module.exports = { calculateShares, createExpense, listExpenses, getExpense };

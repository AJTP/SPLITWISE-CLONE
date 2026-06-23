const balancesRepository = require("./balances.repository");
const groupsRepository = require("../groups/groups.repository");

function notMemberError() {
  const err = new Error("Group not found or access denied");
  err.statusCode = 403;
  return err;
}

/**
 * Pure function — exported for unit testing.
 * Computes each user's net balance across all group expenses and settlements.
 * Positive = is owed money. Negative = owes money.
 *
 * Settlements reduce the payer's outstanding debt (+amount)
 * and the payee's outstanding credit (-amount).
 */
function computeNetBalances(expenses, settlements = []) {
  const balances = {};

  for (const expense of expenses) {
    const { paidById, participants } = expense;
    for (const participant of participants) {
      const share = Number(participant.shareAmount);
      const uid = participant.userId;
      balances[uid] = (balances[uid] || 0) - share;
      balances[paidById] = (balances[paidById] || 0) + share;
    }
  }

  for (const settlement of settlements) {
    const amount = Number(settlement.amount);
    balances[settlement.payerId] = (balances[settlement.payerId] || 0) + amount;
    balances[settlement.payeeId] = (balances[settlement.payeeId] || 0) - amount;
  }

  return balances;
}

/**
 * Pure function — exported for unit testing.
 * Greedy algorithm: minimises the number of transactions needed to
 * settle all debts. Returns [{ fromUserId, toUserId, amount }].
 */
function simplifyDebts(netBalances) {
  const EPSILON = 0.001;

  const creditors = [];
  const debtors = [];

  for (const [userId, balance] of Object.entries(netBalances)) {
    const rounded = Math.round(balance * 100) / 100;
    if (rounded > EPSILON) creditors.push({ userId, balance: rounded });
    else if (rounded < -EPSILON) debtors.push({ userId, balance: rounded });
  }

  creditors.sort((a, b) => b.balance - a.balance);
  debtors.sort((a, b) => a.balance - b.balance);

  const transactions = [];

  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0];
    const debtor = debtors[0];
    const amount =
      Math.round(Math.min(creditor.balance, -debtor.balance) * 100) / 100;

    if (amount > EPSILON) {
      transactions.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount,
      });
    }

    creditor.balance = Math.round((creditor.balance - amount) * 100) / 100;
    debtor.balance = Math.round((debtor.balance + amount) * 100) / 100;

    if (creditor.balance <= EPSILON) creditors.shift();
    if (debtor.balance >= -EPSILON) debtors.shift();
  }

  return transactions;
}

async function getGroupBalances(groupId, requestingUserId) {
  const member = await groupsRepository.isMember(groupId, requestingUserId);
  if (!member) throw notMemberError();

  const [expenses, members, settlements] = await Promise.all([
    balancesRepository.findExpensesWithParticipants(groupId),
    balancesRepository.findGroupMembers(groupId),
    balancesRepository.findSettlementsByGroup(groupId),
  ]);

  const userMap = {};
  for (const m of members) {
    userMap[m.user.id] = m.user;
  }

  const netBalances = computeNetBalances(expenses, settlements);

  const balances = members.map((m) => ({
    userId: m.user.id,
    userName: m.user.name,
    userEmail: m.user.email,
    amount: Math.round((netBalances[m.user.id] || 0) * 100) / 100,
  }));

  const rawDebts = simplifyDebts(netBalances);
  const simplifiedDebts = rawDebts.map((d) => ({
    fromUserId: d.fromUserId,
    fromUserName: userMap[d.fromUserId]?.name ?? null,
    fromUserEmail: userMap[d.fromUserId]?.email ?? null,
    toUserId: d.toUserId,
    toUserName: userMap[d.toUserId]?.name ?? null,
    toUserEmail: userMap[d.toUserId]?.email ?? null,
    amount: d.amount,
  }));

  return { balances, simplifiedDebts };
}

module.exports = { computeNetBalances, simplifyDebts, getGroupBalances };

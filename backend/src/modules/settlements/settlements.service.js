const settlementsRepository = require("./settlements.repository");
const groupsRepository = require("../groups/groups.repository");

function notMemberError() {
  const err = new Error("Group not found or access denied");
  err.statusCode = 403;
  return err;
}

function notGroupMemberError(role) {
  const err = new Error(`${role} is not a member of this group`);
  err.statusCode = 422;
  return err;
}

function selfPaymentError() {
  const err = new Error("Payer and payee cannot be the same user");
  err.statusCode = 422;
  return err;
}

async function create(
  groupId,
  { payerId, payeeId, amount, notes },
  requestingUserId,
) {
  const member = await groupsRepository.isMember(groupId, requestingUserId);
  if (!member) throw notMemberError();

  if (payerId === payeeId) throw selfPaymentError();

  const [payerMember, payeeMember] = await Promise.all([
    groupsRepository.isMember(groupId, payerId),
    groupsRepository.isMember(groupId, payeeId),
  ]);

  if (!payerMember) throw notGroupMemberError("Payer");
  if (!payeeMember) throw notGroupMemberError("Payee");

  return settlementsRepository.create({
    groupId,
    payerId,
    payeeId,
    amount,
    notes: notes ?? null,
  });
}

module.exports = { create };

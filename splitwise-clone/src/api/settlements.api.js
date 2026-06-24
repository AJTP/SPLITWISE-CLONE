import client from "./client";

export function createSettlement(groupId, { payerId, payeeId, amount, notes }) {
  return client.post(`/groups/${groupId}/settlements`, {
    payerId,
    payeeId,
    amount,
    notes,
  });
}

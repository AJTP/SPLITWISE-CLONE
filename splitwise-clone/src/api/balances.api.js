import client from "./client";

export function getBalances(groupId) {
  return client.get(`/groups/${groupId}/balances`);
}

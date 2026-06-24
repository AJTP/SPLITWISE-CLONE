import client from "./client";

export function listExpenses(groupId, { page = 1, limit = 50 } = {}) {
  return client.get(`/groups/${groupId}/expenses`, { params: { page, limit } });
}

export function createExpense(groupId, data) {
  return client.post(`/groups/${groupId}/expenses`, data);
}

export function getExpense(expenseId) {
  return client.get(`/expenses/${expenseId}`);
}

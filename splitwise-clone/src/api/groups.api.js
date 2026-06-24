import client from "./client";

export function listGroups() {
  return client.get("/groups");
}

export function getGroup(groupId) {
  return client.get(`/groups/${groupId}`);
}

/**
 * Creates a group with all initial member aliases in a single request.
 * @param {{ name: string, description?: string, aliases?: string[] }} data
 */
export function createGroup(data) {
  return client.post("/groups", data);
}

export function deleteGroup(groupId) {
  return client.delete(`/groups/${groupId}`);
}

export function listMembers(groupId) {
  return client.get(`/groups/${groupId}/members`);
}

export function addMember(groupId, { userId, alias }) {
  return client.post(`/groups/${groupId}/members`, { userId, alias });
}

export function removeMember(groupId, userId) {
  return client.delete(`/groups/${groupId}/members/${userId}`);
}

export function generateInviteToken(groupId) {
  return client.post(`/groups/${groupId}/invite`);
}

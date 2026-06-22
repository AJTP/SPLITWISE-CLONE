const groupsRepository = require("./groups.repository");

function notMemberError() {
  const err = new Error("Group not found or access denied");
  err.statusCode = 403;
  return err;
}

async function listGroups(userId) {
  return groupsRepository.findAllByUserId(userId);
}

async function getGroup(groupId, userId) {
  const member = await groupsRepository.isMember(groupId, userId);
  if (!member) throw notMemberError();
  return groupsRepository.findById(groupId);
}

async function createGroup({ name, description }, userId) {
  const group = await groupsRepository.create({ name, description });
  await groupsRepository.addMember(group.id, userId);
  return group;
}

async function deleteGroup(groupId, userId) {
  const member = await groupsRepository.isMember(groupId, userId);
  if (!member) throw notMemberError();
  return groupsRepository.remove(groupId);
}

async function addMember(groupId, targetUserId, requestingUserId) {
  const requesterIsMember = await groupsRepository.isMember(
    groupId,
    requestingUserId,
  );
  if (!requesterIsMember) throw notMemberError();

  const alreadyMember = await groupsRepository.isMember(groupId, targetUserId);
  if (alreadyMember) {
    const err = new Error("User is already a member of this group");
    err.statusCode = 409;
    throw err;
  }

  return groupsRepository.addMember(groupId, targetUserId);
}

async function listMembers(groupId, userId) {
  const member = await groupsRepository.isMember(groupId, userId);
  if (!member) throw notMemberError();
  return groupsRepository.findMembers(groupId);
}

async function removeMember(groupId, targetUserId, requestingUserId) {
  const requesterIsMember = await groupsRepository.isMember(
    groupId,
    requestingUserId,
  );
  if (!requesterIsMember) throw notMemberError();

  const targetIsMember = await groupsRepository.isMember(groupId, targetUserId);
  if (!targetIsMember) {
    const err = new Error("User is not a member of this group");
    err.statusCode = 404;
    throw err;
  }

  return groupsRepository.removeMember(groupId, targetUserId);
}

module.exports = {
  listGroups,
  getGroup,
  createGroup,
  deleteGroup,
  addMember,
  listMembers,
  removeMember,
};

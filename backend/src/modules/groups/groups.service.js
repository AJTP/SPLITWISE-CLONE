const crypto = require("crypto");
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
  const user = await groupsRepository.findUserById(userId);
  await groupsRepository.addMember(group.id, { userId, alias: user.name });
  return group;
}

async function deleteGroup(groupId, userId) {
  const member = await groupsRepository.isMember(groupId, userId);
  if (!member) throw notMemberError();
  return groupsRepository.remove(groupId);
}

async function addMember(groupId, { userId, alias }, requestingUserId) {
  const requesterIsMember = await groupsRepository.isMember(
    groupId,
    requestingUserId,
  );
  if (!requesterIsMember) throw notMemberError();

  if (userId && alias) {
    const err = new Error("Provide either userId or alias, not both");
    err.statusCode = 400;
    throw err;
  }

  if (!userId && !alias) {
    const err = new Error("Provide userId or alias");
    err.statusCode = 400;
    throw err;
  }

  if (userId) {
    const alreadyMember = await groupsRepository.isMember(groupId, userId);
    if (alreadyMember) {
      const err = new Error("User is already a member of this group");
      err.statusCode = 409;
      throw err;
    }
    const user = await groupsRepository.findUserById(userId);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }
    const aliasInUse = await groupsRepository.findMemberByAlias(
      groupId,
      user.name,
    );
    if (aliasInUse) {
      const err = new Error(
        `Alias '${user.name}' is already in use in this group`,
      );
      err.statusCode = 409;
      throw err;
    }
    return groupsRepository.addMember(groupId, { userId, alias: user.name });
  }

  // Guest member
  const aliasInUse = await groupsRepository.findMemberByAlias(groupId, alias);
  if (aliasInUse) {
    const err = new Error(`Alias '${alias}' is already in use in this group`);
    err.statusCode = 409;
    throw err;
  }
  return groupsRepository.addMember(groupId, { alias });
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

async function generateInviteToken(groupId, userId) {
  const member = await groupsRepository.isMember(groupId, userId);
  if (!member) throw notMemberError();

  const token = crypto.randomUUID();
  const group = await groupsRepository.setInviteToken(groupId, token);
  return { inviteToken: group.inviteToken };
}

module.exports = {
  listGroups,
  getGroup,
  createGroup,
  deleteGroup,
  addMember,
  listMembers,
  removeMember,
  generateInviteToken,
};

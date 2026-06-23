const invitationsRepository = require("./invitations.repository");

function invalidTokenError() {
  const err = new Error("Invalid or expired invite token");
  err.statusCode = 404;
  return err;
}

async function getInvitation(token) {
  const group = await invitationsRepository.findGroupByInviteToken(token);
  if (!group) throw invalidTokenError();

  return {
    group: { id: group.id, name: group.name, description: group.description },
    members: group.members.map((m) => ({
      id: m.id,
      alias: m.alias,
      claimed: m.userId !== null,
    })),
  };
}

async function claimMember(token, memberId, userId) {
  const group = await invitationsRepository.findGroupByInviteToken(token);
  if (!group) throw invalidTokenError();

  const member = await invitationsRepository.findMemberById(memberId);
  if (!member || member.groupId !== group.id) {
    const err = new Error("Member not found in this group");
    err.statusCode = 404;
    throw err;
  }

  if (member.userId !== null) {
    const err = new Error("This alias has already been claimed");
    err.statusCode = 409;
    throw err;
  }

  const alreadyMember = await invitationsRepository.isUserAlreadyMember(
    group.id,
    userId,
  );
  if (alreadyMember) {
    const err = new Error("You are already a member of this group");
    err.statusCode = 409;
    throw err;
  }

  const updated = await invitationsRepository.claimMember(memberId, userId);
  return {
    id: updated.id,
    alias: updated.alias,
    groupId: updated.groupId,
    userId: updated.userId,
  };
}

module.exports = { getInvitation, claimMember };

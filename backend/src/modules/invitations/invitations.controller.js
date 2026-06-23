const invitationsService = require("./invitations.service");

async function getInvitation(request, reply) {
  const result = await invitationsService.getInvitation(request.params.token);
  return reply.code(200).send(result);
}

async function claimMember(request, reply) {
  const result = await invitationsService.claimMember(
    request.params.token,
    request.body.memberId,
    request.user.userId,
  );
  return reply.code(200).send(result);
}

module.exports = { getInvitation, claimMember };

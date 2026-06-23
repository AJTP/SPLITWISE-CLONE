const authMiddleware = require("../../middlewares/auth.middleware");
const invitationsController = require("./invitations.controller");
const { getInvitationSchema, claimInvitationSchema } = require("./schemas");

async function plugin(fastify, opts) {
  // Public: anyone with the link can see group + unclaimed aliases
  fastify.get(
    "/:token",
    { schema: getInvitationSchema },
    invitationsController.getInvitation,
  );

  // Auth required: claim your alias slot
  fastify.post(
    "/:token/claim",
    { preHandler: [authMiddleware], schema: claimInvitationSchema },
    invitationsController.claimMember,
  );
}

module.exports = plugin;

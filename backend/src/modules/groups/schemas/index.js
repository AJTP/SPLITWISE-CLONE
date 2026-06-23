const listGroupsSchema = require("./list-groups.schema");
const getGroupSchema = require("./get-group.schema");
const createGroupSchema = require("./create-group.schema");
const deleteGroupSchema = require("./delete-group.schema");
const addMemberSchema = require("./add-member.schema");
const listMembersSchema = require("./list-members.schema");
const removeMemberSchema = require("./remove-member.schema");
const generateInviteSchema = require("./generate-invite.schema");

module.exports = {
  listGroupsSchema,
  getGroupSchema,
  createGroupSchema,
  deleteGroupSchema,
  addMemberSchema,
  listMembersSchema,
  removeMemberSchema,
  generateInviteSchema,
};

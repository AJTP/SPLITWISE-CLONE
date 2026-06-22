const bcryptjs = require("bcryptjs");

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS, 10) || 10;

function hashPassword(password) {
  return bcryptjs.hash(password, SALT_ROUNDS);
}

module.exports = { hashPassword };

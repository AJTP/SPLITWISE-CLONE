const usersRepository = require("./users.repository");

async function listUsers() {
  return usersRepository.findAll();
}

async function getUser(id) {
  return usersRepository.findById(id);
}

async function createUser({ name, email }) {
  return usersRepository.create({ name, email });
}

async function updateUser(id, data) {
  return null;
}

async function removeUser(id) {
  return null;
}

module.exports = { listUsers, getUser, createUser, updateUser, removeUser };

const { hashPassword } = require("../../utils/auth-utils");
const usersRepository = require("./users.repository");

async function listUsers() {
  return usersRepository.findAll();
}

async function getUser(id) {
  return usersRepository.findById(id);
}

async function createUser({ name, email }) {
  const password = Math.random().toString(36).slice(-10);
  const hashedPassword = await hashPassword(password);
  return await usersRepository.create({
    name,
    email,
    password: hashedPassword,
  });
}

async function updateUser(id, { name, email }) {
  return usersRepository.update(id, { name, email });
}

async function removeUser(id) {
  return usersRepository.remove(id);
}

module.exports = { listUsers, getUser, createUser, updateUser, removeUser };

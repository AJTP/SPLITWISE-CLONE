const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authRepository = require("./auth.repository");
const { hashPassword } = require("../../utils/auth-utils");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

function sanitizeUser(user) {
  const { password: _, ...safe } = user;
  return safe;
}

async function register({ name, email, password }) {
  const existing = await authRepository.findUserByEmail(email);
  if (existing) {
    const err = new Error("Email already in use");
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await hashPassword(password);

  const user = await authRepository.createUser({
    name,
    email,
    password: hashedPassword,
  });
  const token = generateToken(user);

  return { token, user: sanitizeUser(user) };
}

async function login({ email, password }) {
  const user = await authRepository.findUserByEmail(email);

  const invalidErr = new Error("Invalid email or password");
  invalidErr.statusCode = 401;

  if (!user) throw invalidErr;

  const valid = await bcryptjs.compare(password, user.password);
  if (!valid) throw invalidErr;

  const token = generateToken(user);
  return { token, user: sanitizeUser(user) };
}

module.exports = { register, login };

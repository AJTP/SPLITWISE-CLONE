const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

async function authMiddleware(request, reply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const err = new Error("Missing or invalid Authorization header");
    err.statusCode = 401;
    throw err;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    request.user = decoded;
  } catch {
    const err = new Error("Invalid or expired token");
    err.statusCode = 401;
    throw err;
  }
}

module.exports = authMiddleware;

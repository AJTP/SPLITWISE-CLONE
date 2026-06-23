const authMiddleware = require("./auth.middleware");

async function adminMiddleware(request, reply) {
  await authMiddleware(request, reply);

  if (request.user.role !== "ADMIN") {
    const err = new Error("Forbidden: admin access required");
    err.statusCode = 403;
    throw err;
  }
}

module.exports = adminMiddleware;

const PRISMA_ERROR_MAP = {
  // Constraint violations
  P2002: {
    statusCode: 409,
    message: "A record with that value already exists",
  },
  P2003: { statusCode: 400, message: "Related record not found" },
  P2014: {
    statusCode: 400,
    message: "Operation would violate a required relation",
  },
  // Null / missing value
  P2011: { statusCode: 400, message: "A required field is missing a value" },
  P2012: { statusCode: 400, message: "Missing a required value" },
  // Not found
  P2001: { statusCode: 404, message: "Record not found" },
  P2015: { statusCode: 404, message: "Related record not found" },
  P2025: { statusCode: 404, message: "Record not found" },
  // Value / type errors
  P2006: { statusCode: 400, message: "Invalid value provided for a field" },
  P2020: { statusCode: 400, message: "Value out of range for this field" },
  // Infrastructure
  P2024: {
    statusCode: 503,
    message: "Database connection pool timeout, try again later",
  },
};

function errorHandler(error, request, reply) {
  if (error.code && error.code in PRISMA_ERROR_MAP) {
    const { statusCode, message } = PRISMA_ERROR_MAP[error.code];
    return reply
      .code(statusCode)
      .send({ statusCode, error: "DatabaseError", message });
  }

  const statusCode = error.statusCode ?? 500;
  reply.code(statusCode).send({
    statusCode,
    error: error.name,
    message: error.message,
  });
}

module.exports = errorHandler;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  return EMAIL_REGEX.test(value);
}

export function isMinLength(value, min) {
  return typeof value === "string" && value.trim().length >= min;
}

export function passwordsMatch(a, b) {
  return a === b;
}

/**
 * Returns the first error message found, or null if all pass.
 * @param {Array<{ check: boolean, message: string }>} rules
 */
export function firstError(rules) {
  const failed = rules.find((r) => !r.check);
  return failed ? failed.message : null;
}

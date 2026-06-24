const formatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats a number as a Euro currency string.
 * @param {number | string} amount
 * @returns {string}  e.g. "12,50 €"
 */
export function formatCurrency(amount) {
  return formatter.format(Number(amount));
}

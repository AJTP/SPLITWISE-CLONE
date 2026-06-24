/**
 * Groups an array of items by the date portion of a given field.
 * Returns an array of { label: string, items: T[] } sorted newest first.
 *
 * @template T
 * @param {T[]} items
 * @param {keyof T} dateField  - name of the date field on each item
 * @returns {{ label: string, items: T[] }[]}
 */
export function groupByDate(items, dateField = "date") {
  const map = new Map();

  for (const item of items) {
    const raw = item[dateField];
    const date = new Date(raw);
    const label = date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    if (!map.has(label)) {
      map.set(label, { label, date, items: [] });
    }
    map.get(label).items.push(item);
  }

  return Array.from(map.values())
    .sort((a, b) => b.date - a.date)
    .map(({ label, items }) => ({ label, items }));
}

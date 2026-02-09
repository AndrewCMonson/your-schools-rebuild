export function slugifySegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function slugToWords(value: string) {
  return value
    .trim()
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function titleCaseWords(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

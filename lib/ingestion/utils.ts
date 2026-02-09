import { createHash } from "node:crypto";

export function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeText(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return compactWhitespace(value);
  if (typeof value === "number" || typeof value === "boolean") return compactWhitespace(String(value));
  return "";
}

export function normalizeState(value: unknown) {
  return normalizeText(value).toUpperCase();
}

export function normalizeZip(value: unknown) {
  const zip = normalizeText(value);
  if (!zip) return "";
  const digits = zip.replace(/[^0-9-]/g, "");
  return digits.slice(0, 10);
}

export function parseOptionalNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

export function parseOptionalDate(value: string | null | undefined) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

export function isTruthy(value: string | null | undefined) {
  if (!value) return undefined;
  const normalized = normalizeText(value).toLowerCase();
  if (["1", "true", "yes", "y"].includes(normalized)) return true;
  if (["0", "false", "no", "n"].includes(normalized)) return false;
  return undefined;
}

export function stableHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function slugify(value: string) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function makeFallbackSourceId(parts: string[]) {
  const joined = parts
    .map((part) => normalizeText(part))
    .filter(Boolean)
    .join("|");

  return stableHash(joined || Date.now().toString()).slice(0, 20);
}

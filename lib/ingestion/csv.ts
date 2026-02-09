import { compactWhitespace } from "@/lib/ingestion/utils";

function normalizeHeader(header: string) {
  return compactWhitespace(header)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/(^_|_$)/g, "");
}

export function parseCsvRows(input: string) {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === ",") {
      row.push(current);
      current = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }

      row.push(current);
      current = "";

      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    if (row.some((value) => value.length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

export function parseCsvRecords(input: string) {
  const rows = parseCsvRows(input);
  if (rows.length === 0) return [] as Record<string, string>[];

  const headers = rows[0].map(normalizeHeader);
  const records: Record<string, string>[] = [];

  for (const row of rows.slice(1)) {
    const record: Record<string, string> = {};

    for (let index = 0; index < headers.length; index += 1) {
      const key = headers[index];
      if (!key) continue;
      record[key] = compactWhitespace(row[index] ?? "");
    }

    records.push(record);
  }

  return records;
}

export function pickValue(
  row: Record<string, string>,
  keys: string[],
) {
  for (const key of keys) {
    const normalized = normalizeHeader(key);
    const value = row[normalized];
    if (value) return value;
  }
  return "";
}

import { IngestionSource } from "@prisma/client";
import { NextResponse } from "next/server";
import { runSelectedSources } from "@/lib/ingestion/pipeline";

function parseSources(input: string | null) {
  if (!input) {
    return [
      IngestionSource.HEAD_START,
      IngestionSource.NCES_PK,
      IngestionSource.VA_LICENSE,
      IngestionSource.FL_LICENSE,
      IngestionSource.TX_LICENSE,
    ];
  }

  const values = input
    .split(",")
    .map((part) => part.trim().toUpperCase())
    .filter(Boolean);

  const selected: IngestionSource[] = [];
  for (const value of values) {
    if (
      value === IngestionSource.HEAD_START ||
      value === IngestionSource.NCES_PK ||
      value === IngestionSource.VA_LICENSE ||
      value === IngestionSource.FL_LICENSE ||
      value === IngestionSource.TX_LICENSE
    ) {
      selected.push(value);
    }
  }

  return selected.length > 0
    ? selected
    : [
        IngestionSource.HEAD_START,
        IngestionSource.NCES_PK,
        IngestionSource.VA_LICENSE,
        IngestionSource.FL_LICENSE,
        IngestionSource.TX_LICENSE,
      ];
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const selectedSources = parseSources(url.searchParams.get("sources"));
  const results = await runSelectedSources(selectedSources);

  const ok = results.every((result) => result.status === "SUCCEEDED");

  return NextResponse.json(
    {
      ok,
      sources: selectedSources,
      results,
    },
    { status: ok ? 200 : 500 },
  );
}

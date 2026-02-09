import { NextResponse } from "next/server";
import { runWebsiteEnrichment } from "@/lib/enrichment/websites";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "100");
  const dryRunParam = url.searchParams.get("dryRun") ?? "false";
  const maxCandidates = Number(url.searchParams.get("maxCandidates") ?? process.env.WEBSITE_ENRICHMENT_MAX_CANDIDATES ?? "5");
  const dryRun = ["1", "true", "yes", "y"].includes(dryRunParam.toLowerCase());

  const result = await runWebsiteEnrichment({
    limit: Number.isFinite(limit) ? limit : 100,
    dryRun,
    maxCandidates: Number.isFinite(maxCandidates) ? maxCandidates : 5,
  });

  return NextResponse.json({ ok: true, dryRun, ...result });
}

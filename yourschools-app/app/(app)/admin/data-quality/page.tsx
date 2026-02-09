import Link from "next/link";
import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  formatCoverage,
  getDedupeSummary,
  getLatestCoverageSnapshot,
  rebuildCoverageSnapshot,
} from "@/lib/data-quality";
import { adminRebuildCoverageSnapshotAction } from "@/lib/actions/admin-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DataQualityPage() {
  await requireAdminSession();

  let snapshot = await getLatestCoverageSnapshot();
  if (!snapshot) {
    await rebuildCoverageSnapshot();
    snapshot = await getLatestCoverageSnapshot();
  }

  const [dedupe, latestRuns] = await Promise.all([
    getDedupeSummary(),
    db.ingestionRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 8,
    }),
  ]);

  const schoolRows = snapshot?.rows.filter((row) => row.scope === "school") ?? [];
  const sourceRows = snapshot?.rows.filter((row) => row.scope === "source") ?? [];

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Data Quality Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Latest snapshot: {snapshot ? new Date(snapshot.capturedAt).toLocaleString() : "No snapshot yet"}
          </p>
        </div>
        <div className="flex gap-2">
          <form action={adminRebuildCoverageSnapshotAction}>
            <Button type="submit">Refresh Coverage Snapshot</Button>
          </form>
          <Link href="/admin">
            <Button variant="outline">Back to Admin</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Source records</p>
            <p className="text-2xl font-bold">{dedupe.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Matched by source ID</p>
            <p className="text-2xl font-bold">{dedupe.sourceId}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Matched by license</p>
            <p className="text-2xl font-bold">{dedupe.license}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Matched by name/address</p>
            <p className="text-2xl font-bold">{dedupe.nameAddress}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>School Table Coverage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {schoolRows.length === 0 ? (
            <p className="text-muted-foreground">No rows.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2">Field</th>
                    <th className="py-2">Populated</th>
                    <th className="py-2">High confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {schoolRows.map((row) => (
                    <tr key={`${row.scope}-${row.fieldKey}`} className="border-b border-border/50">
                      <td className="py-2 font-medium">{row.fieldKey}</td>
                      <td className="py-2">{formatCoverage(row.populatedCount, row.totalCount)}</td>
                      <td className="py-2">{formatCoverage(row.highConfidenceCount, row.totalCount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Source Field Availability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {sourceRows.length === 0 ? (
            <p className="text-muted-foreground">No rows.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2">Source</th>
                    <th className="py-2">Field</th>
                    <th className="py-2">Populated</th>
                  </tr>
                </thead>
                <tbody>
                  {sourceRows.map((row) => (
                    <tr key={`${row.source}-${row.fieldKey}`} className="border-b border-border/50">
                      <td className="py-2 font-medium">{row.source}</td>
                      <td className="py-2">{row.fieldKey}</td>
                      <td className="py-2">{formatCoverage(row.populatedCount, row.totalCount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Ingestion Runs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {latestRuns.length === 0 ? (
            <p className="text-muted-foreground">No ingestion runs yet.</p>
          ) : (
            latestRuns.map((run) => (
              <div key={run.id} className="rounded-md border border-border p-3">
                <p className="font-semibold">{run.source} · {run.status}</p>
                <p className="text-muted-foreground">
                  seen {run.recordsSeen} · upserted {run.recordsUpserted} · skipped {run.recordsSkipped}
                </p>
                <p className="text-muted-foreground">{new Date(run.startedAt).toLocaleString()}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}

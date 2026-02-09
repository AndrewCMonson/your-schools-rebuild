import { subDays } from "date-fns";
import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminSeoPage() {
  await requireAdminSession();

  const windowStart = subDays(new Date(), 30);
  const [indexedCandidates, views30, searches30] = await Promise.all([
    db.school.count(),
    db.schoolPageView.count({
      where: {
        viewedAt: {
          gte: windowStart,
        },
      },
    }),
    db.searchHistory.findMany({
      where: {
        createdAt: {
          gte: windowStart,
        },
      },
      select: {
        query: true,
        filtersJson: true,
      },
    }),
  ]);

  const zeroResultSearches = searches30.filter((entry) => {
    const value = entry.filtersJson as { hasResults?: boolean } | null;
    return value?.hasResults === false;
  });
  const zeroResultByQuery = new Map<string, number>();
  for (const entry of zeroResultSearches) {
    const key = entry.query.toLowerCase().trim();
    zeroResultByQuery.set(key, (zeroResultByQuery.get(key) ?? 0) + 1);
  }
  const topZeroResultQueries = Array.from(zeroResultByQuery.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8 md:py-10">
      <h1 className="text-3xl font-bold">SEO & Discovery Metrics</h1>
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Indexable school pages</p>
            <p className="text-2xl font-bold">{indexedCandidates}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">School page views (30d)</p>
            <p className="text-2xl font-bold">{views30}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Zero-result searches (30d)</p>
            <p className="text-2xl font-bold">{zeroResultSearches.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top zero-result queries (30d)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {topZeroResultQueries.length === 0 ? (
            <p className="text-muted-foreground">No zero-result queries captured in this window.</p>
          ) : (
            topZeroResultQueries.map(([query, count]) => (
              <div key={query} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <span>{query}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}

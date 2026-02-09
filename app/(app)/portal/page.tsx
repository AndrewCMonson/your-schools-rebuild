import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getManagedSchools, isSiteAdmin } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function PortalDashboardPage() {
  const session = await requireSession();
  const [managedSchools, siteAdmin] = await Promise.all([
    getManagedSchools(session.user.id),
    isSiteAdmin(session.user.id),
  ]);

  if (managedSchools.length === 0 && !siteAdmin) {
    return (
      <section className="mx-auto max-w-4xl space-y-4 px-4 py-8 md:px-8 md:py-10">
        <h1 className="text-3xl font-bold">School Portal</h1>
        <p className="text-muted-foreground">
          Your account does not have school-admin access yet. Ask a site admin to assign you to a school.
        </p>
      </section>
    );
  }

  const schoolIds = managedSchools.map((school) => school.id);
  const [pendingFlags, recentViews] = await Promise.all([
    db.reviewFlag.findMany({
      where: {
        schoolResponse: null,
        review: {
          schoolId: { in: schoolIds.length > 0 ? schoolIds : ["__none__"] },
        },
      },
      include: {
        review: {
          include: { school: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.schoolPageView.groupBy({
      by: ["schoolId"],
      where: {
        schoolId: { in: schoolIds.length > 0 ? schoolIds : ["__none__"] },
      },
      _count: { _all: true },
    }),
  ]);

  const viewsBySchool = new Map(recentViews.map((entry) => [entry.schoolId, entry._count._all]));
  const totalViews = recentViews.reduce((sum, entry) => sum + entry._count._all, 0);

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">School Portal</h1>
        {siteAdmin ? (
          <Link href="/admin">
            <Button variant="outline" size="sm">Open site admin</Button>
          </Link>
        ) : null}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Managed schools</p><p className="text-2xl font-bold">{managedSchools.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Pending flag responses</p><p className="text-2xl font-bold">{pendingFlags.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total profile views</p><p className="text-2xl font-bold">{totalViews}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {managedSchools.map((school) => (
          <Card key={school.id} className="flex h-full flex-col">
            <CardHeader>
              <CardTitle className="line-clamp-2">{school.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3 text-sm">
              <p className="truncate text-muted-foreground">{school.city}, {school.state} {school.zipcode}</p>
              <p>Total page views: {viewsBySchool.get(school.id) ?? 0}</p>
              <Link href={`/portal/schools/${school.id}`} className="mt-auto">
                <Button size="sm">Manage school</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flag responses pending</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {pendingFlags.length === 0 ? (
            <p className="text-muted-foreground">No pending review flags need a school response.</p>
          ) : (
            pendingFlags.map((flag) => (
              <div key={flag.id} className="rounded-md border border-border p-3">
                <p className="font-semibold">{flag.review.school.name}</p>
                <p className="text-muted-foreground">Reason: {flag.reason}</p>
                <p className="mt-1">{flag.review.body}</p>
                <Link href={`/portal/schools/${flag.review.schoolId}`} className="mt-2 inline-block">
                  <Button size="sm" variant="outline">Respond in school portal</Button>
                </Link>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}

import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toggleFavoriteAction } from "@/lib/actions/favorite-actions";
import { upsertParentPlanItemAction } from "@/lib/actions/parent-plan-actions";
import { SubmitButton } from "@/components/ui/submit-button";

function toSearchHref(entry: {
  filtersJson: unknown;
  zipcode: string | null;
  town: string | null;
  schoolName: string | null;
}) {
  const params = new URLSearchParams();
  if (entry.filtersJson && typeof entry.filtersJson === "object") {
    for (const [key, value] of Object.entries(entry.filtersJson as Record<string, unknown>)) {
      if (typeof value === "string" && value.trim()) params.set(key, value);
    }
  }
  if (entry.zipcode && !params.has("zipcode")) params.set("zipcode", entry.zipcode);
  if (entry.town && !params.has("town")) params.set("town", entry.town);
  if (entry.schoolName && !params.has("q")) params.set("q", entry.schoolName);
  return `/schools?${params.toString()}`;
}

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requireSession();

  const [favorites, history, planItems] = await Promise.all([
    db.favorite.findMany({
      where: { userId: session.user.id },
      include: { school: true },
      orderBy: { createdAt: "desc" },
    }),
    db.searchHistory.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    db.parentPlanItem.findMany({
      where: { userId: session.user.id },
      include: {
        school: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 20,
    }),
  ]);

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8 md:py-10">
      <h1 className="text-3xl font-bold">Profile</h1>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Family decision tracker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {planItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No schools in your plan yet. Add from any school profile.</p>
            ) : (
              planItems.map((item) => (
                <form key={item.id} action={upsertParentPlanItemAction} className="space-y-2 rounded-md border border-border p-3">
                  <input type="hidden" name="schoolId" value={item.schoolId} />
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{item.school.name}</p>
                    <Link href={`/schools/${item.school.slug}`}>
                      <Button size="sm" variant="outline">View</Button>
                    </Link>
                  </div>
                  <div className="grid gap-2 md:grid-cols-3">
                    <select name="status" defaultValue={item.status} className="h-10 rounded-md border border-border bg-white/90 px-3 text-sm">
                      <option value="SAVED">Saved</option>
                      <option value="TOUR_REQUESTED">Tour Requested</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="APPLIED">Applied</option>
                    </select>
                    <input
                      type="date"
                      name="remindAt"
                      defaultValue={item.remindAt ? item.remindAt.toISOString().slice(0, 10) : ""}
                      className="h-10 rounded-md border border-border bg-white/90 px-3 text-sm"
                    />
                    <SubmitButton type="submit" size="sm" pendingText="Saving...">Save</SubmitButton>
                  </div>
                  <textarea
                    name="notes"
                    defaultValue={item.notes ?? ""}
                    placeholder="Notes for your family decision..."
                    className="min-h-[80px] w-full rounded-md border border-border bg-white/90 px-3 py-2 text-sm"
                  />
                </form>
              ))
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Saved schools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {favorites.length === 0 ? (
              <p className="text-sm text-muted-foreground">You have no saved schools yet.</p>
            ) : (
              favorites.map((favorite: (typeof favorites)[number]) => (
                <div key={favorite.id} className="flex items-center justify-between rounded-md border border-border p-3">
                  <div>
                    <p className="font-semibold">{favorite.school.name}</p>
                    <p className="text-xs text-muted-foreground">{favorite.school.city}, {favorite.school.state}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/schools/${favorite.school.slug}`}>
                      <Button size="sm" variant="outline">Open</Button>
                    </Link>
                    <form action={toggleFavoriteAction}>
                      <input type="hidden" name="schoolId" value={favorite.school.id} />
                      <Button size="sm" variant="ghost" type="submit">Remove</Button>
                    </form>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent searches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent searches yet.</p>
            ) : (
              history.map((entry: (typeof history)[number]) => (
                <div key={entry.id} className="rounded-md border border-border p-3 text-sm">
                  <p className="font-medium">{entry.query}</p>
                  <p className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</p>
                  <Link href={toSearchHref(entry)} className="mt-2 inline-block">
                    <Button size="sm" variant="outline">Run Again</Button>
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

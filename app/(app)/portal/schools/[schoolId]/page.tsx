import { notFound } from "next/navigation";
import { subDays } from "date-fns";
import { requireSchoolScope } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import {
  respondToFlagAction,
  updateSchoolProfileAction,
} from "@/lib/actions/school-portal-actions";
import { ImageUploadPanel } from "@/components/admin/image-upload-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageReorderManager } from "@/components/portal/image-reorder-manager";

interface PortalSchoolPageProps {
  params: Promise<{ schoolId: string }>;
}

export const dynamic = "force-dynamic";

export default async function PortalSchoolPage({ params }: PortalSchoolPageProps) {
  const { schoolId } = await params;
  await requireSchoolScope(schoolId);

  const school = await db.school.findUnique({
    where: { id: schoolId },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!school) {
    notFound();
  }

  const [flags, viewsToday, views7d] = await Promise.all([
    db.reviewFlag.findMany({
      where: {
        review: { schoolId },
      },
      include: {
        review: true,
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    db.schoolPageView.count({
      where: {
        schoolId,
        viewedAt: {
          gte: subDays(new Date(), 1),
        },
      },
    }),
    db.schoolPageView.count({
      where: {
        schoolId,
        viewedAt: {
          gte: subDays(new Date(), 7),
        },
      },
    }),
  ]);

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8 md:py-10">
      <h1 className="text-3xl font-bold">Manage {school.name}</h1>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Profile views (24h)</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{viewsToday}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Profile views (7 days)</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{views7d}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pending flags</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{flags.filter((flag) => !flag.schoolResponse).length}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>School profile</CardTitle></CardHeader>
        <CardContent>
          <form action={updateSchoolProfileAction} className="grid gap-3 md:grid-cols-2">
            <input type="hidden" name="schoolId" value={school.id} />
            <Input name="name" defaultValue={school.name} placeholder="School name" required />
            <Input name="address" defaultValue={school.address} placeholder="Address" required />
            <Input name="city" defaultValue={school.city} placeholder="City" required />
            <Input name="state" defaultValue={school.state} placeholder="State" required />
            <Input name="zipcode" defaultValue={school.zipcode} placeholder="Zipcode" required />
            <Input name="phone" defaultValue={school.phone ?? ""} placeholder="Phone" />
            <Input name="website" defaultValue={school.website ?? ""} placeholder="Website" />
            <Input name="email" defaultValue={school.email ?? ""} placeholder="Contact email" />
            <Input name="minTuition" defaultValue={school.minTuition ?? ""} type="number" placeholder="Min tuition" />
            <Input name="maxTuition" defaultValue={school.maxTuition ?? ""} type="number" placeholder="Max tuition" />
            <Input name="minAge" defaultValue={school.minAge ?? ""} type="number" placeholder="Min age" />
            <Input name="maxAge" defaultValue={school.maxAge ?? ""} type="number" placeholder="Max age" />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="offersDaycare"
                value="true"
                defaultChecked={school.offersDaycare}
                className="h-4 w-4 rounded border-border"
              />
              Offers daycare
            </label>
            <Textarea
              name="description"
              defaultValue={school.description ?? ""}
              className="md:col-span-2"
              placeholder="Description"
            />
            <Button type="submit" className="md:col-span-2">Save profile</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Images</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <ImageUploadPanel schools={[{ id: school.id, name: school.name }]} />
          <ImageReorderManager
            schoolId={school.id}
            images={school.images.map((image) => ({ id: image.id, url: image.url, alt: image.alt }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Review flag responses</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm">
          {flags.length === 0 ? (
            <p className="text-muted-foreground">No flags yet.</p>
          ) : (
            flags.map((flag) => (
              <div key={flag.id} className="space-y-2 rounded-md border border-border p-3">
                <p className="font-semibold">Reason: {flag.reason}</p>
                <p>{flag.review.body}</p>
                {flag.schoolResponse ? (
                  <p className="text-muted-foreground">School response: {flag.schoolResponse}</p>
                ) : (
                  <form action={respondToFlagAction} className="space-y-2">
                    <input type="hidden" name="flagId" value={flag.id} />
                    <Textarea name="response" placeholder="Provide school context for admin review..." className="min-h-[84px]" required />
                    <Button type="submit" size="sm">Submit response</Button>
                  </form>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}

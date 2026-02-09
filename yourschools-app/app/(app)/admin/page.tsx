import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClaimDecisionForm } from "@/components/admin/claim-decision-form";
import { FlagDecisionForm } from "@/components/admin/flag-decision-form";
import { ImageUploadPanel } from "@/components/admin/image-upload-panel";
import { MembershipAssignForm } from "@/components/admin/membership-assign-form";
import { MembershipSuspendForm } from "@/components/admin/membership-suspend-form";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdminSession();

  const [claims, flags, schools, users, memberships, auditLogs] = await Promise.all([
    db.claimRequest.findMany({
      where: { status: "PENDING" },
      include: {
        school: true,
        user: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
    db.reviewFlag.findMany({
      where: { status: "PENDING" },
      include: {
        review: {
          include: {
            school: true,
            user: true,
          },
        },
        responseUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
    db.school.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
      orderBy: {
        email: "asc",
      },
    }),
    db.schoolMembership.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        school: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    }),
    db.auditLog.findMany({
      include: {
        actor: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 80,
    }),
  ]);

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8 md:py-10">
      <h1 className="text-3xl font-bold">Admin Console</h1>
      <div className="grid gap-3 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Pending claims</p><p className="text-2xl font-bold">{claims.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Pending flags</p><p className="text-2xl font-bold">{flags.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Active memberships</p><p className="text-2xl font-bold">{memberships.filter((item) => item.status === "ACTIVE").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Audit entries loaded</p><p className="text-2xl font-bold">{auditLogs.length}</p></CardContent></Card>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href="/admin/data-quality"><span className="inline-flex rounded-md border border-border px-3 py-1 text-sm">Data Quality</span></a>
        <a href="/admin/seo"><span className="inline-flex rounded-md border border-border px-3 py-1 text-sm">SEO Metrics</span></a>
        <a href="#claims"><span className="inline-flex rounded-md border border-border px-3 py-1 text-sm">Claims</span></a>
        <a href="#flags"><span className="inline-flex rounded-md border border-border px-3 py-1 text-sm">Flags</span></a>
        <a href="#memberships"><span className="inline-flex rounded-md border border-border px-3 py-1 text-sm">Memberships</span></a>
        <a href="#audit"><span className="inline-flex rounded-md border border-border px-3 py-1 text-sm">Audit</span></a>
        <a href="#images"><span className="inline-flex rounded-md border border-border px-3 py-1 text-sm">Images</span></a>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card id="claims">
          <CardHeader>
            <CardTitle>Pending claims</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {claims.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending claims.</p>
            ) : (
              claims.map((claim: (typeof claims)[number]) => (
                <div key={claim.id} className="space-y-2 rounded-md border border-border p-3 text-sm">
                  <p className="font-semibold">{claim.school.name}</p>
                  <p>Submitted by: {claim.fullName} ({claim.workEmail})</p>
                  <p>Role: {claim.roleTitle}</p>
                  <p className="text-muted-foreground">{claim.proof}</p>
                  <ClaimDecisionForm claimId={claim.id} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card id="flags">
          <CardHeader>
            <CardTitle>Review flags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {flags.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending flags.</p>
            ) : (
              flags.map((flag: (typeof flags)[number]) => (
                <div key={flag.id} className="space-y-2 rounded-md border border-border p-3 text-sm">
                  <p className="font-semibold">{flag.review.school.name}</p>
                  <p>Review by: {flag.review.user.name ?? "User"}</p>
                  <p className="text-muted-foreground">Flag reason: {flag.reason}</p>
                  <p className="text-muted-foreground">Review text: {flag.review.body}</p>
                  {flag.schoolResponse ? (
                    <p className="text-muted-foreground">
                      School response ({flag.responseUser?.email ?? "school user"}): {flag.schoolResponse}
                    </p>
                  ) : null}
                  <FlagDecisionForm flagId={flag.id} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card id="memberships">
          <CardHeader>
            <CardTitle>School memberships</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MembershipAssignForm users={users} schools={schools} />
            <div className="space-y-2 text-sm">
              {memberships.length === 0 ? (
                <p className="text-muted-foreground">No memberships yet.</p>
              ) : (
                memberships.map((membership) => (
                  <div key={membership.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                    <div>
                      <p className="font-semibold">{membership.school.name}</p>
                      <p>{membership.user.name ?? membership.user.email}</p>
                      <p className="text-muted-foreground">{membership.role} · {membership.status}</p>
                    </div>
                    {membership.status === "ACTIVE" ? <MembershipSuspendForm membershipId={membership.id} /> : null}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card id="audit">
          <CardHeader>
            <CardTitle>Audit logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {auditLogs.length === 0 ? (
              <p className="text-muted-foreground">No audit logs yet.</p>
            ) : (
              auditLogs.map((item) => (
                <div key={item.id} className="rounded-md border border-border p-3">
                  <p className="font-semibold">{item.action}</p>
                  <p className="text-muted-foreground">{item.entityType}:{item.entityId}</p>
                  <p className="text-muted-foreground">{item.actor.email} · {new Date(item.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
      <Card id="images">
        <CardHeader>
          <CardTitle>School image pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUploadPanel schools={schools} />
        </CardContent>
      </Card>
    </section>
  );
}

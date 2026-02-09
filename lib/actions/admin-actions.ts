"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { FlagStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { rebuildCoverageSnapshot } from "@/lib/data-quality";

export async function adminResolveFlagAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized.");
  }

  const flagId = String(formData.get("flagId") ?? "");
  const decision = String(formData.get("decision") ?? "") as FlagStatus;

  if (!flagId || !["RESOLVED", "DISMISSED"].includes(decision)) {
    throw new Error("Invalid moderation decision.");
  }

  const flag = await db.reviewFlag.update({
    where: { id: flagId },
    data: {
      status: decision,
      reviewedAt: new Date(),
      reviewedById: session.user.id,
    },
    include: {
      review: true,
    },
  });

  if (decision === "RESOLVED") {
    await db.review.update({
      where: { id: flag.reviewId },
      data: {
        status: "HIDDEN",
      },
    });
  } else {
    await db.review.update({
      where: { id: flag.reviewId },
      data: {
        status: "PUBLISHED",
      },
    });
  }

  await logAudit({
    actorId: session.user.id,
    action: decision === "RESOLVED" ? "review_flag_resolved" : "review_flag_dismissed",
    entityType: "ReviewFlag",
    entityId: flagId,
  });

  revalidatePath("/admin");
  revalidatePath("/schools/[slug]", "page");

}

export async function adminRebuildCoverageSnapshotAction() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized.");
  }

  const result = await rebuildCoverageSnapshot();

  await logAudit({
    actorId: session.user.id,
    action: "coverage_snapshot_rebuilt",
    entityType: "DataCoverageSnapshot",
    entityId: result.capturedAt.toISOString(),
    metadata: {
      rowCount: result.rowCount,
      capturedAt: result.capturedAt.toISOString(),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/data-quality");
}

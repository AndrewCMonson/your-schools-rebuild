"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { ParentPlanStatus } from "@prisma/client";

const validStatuses = new Set<ParentPlanStatus>([
  ParentPlanStatus.SAVED,
  ParentPlanStatus.TOUR_REQUESTED,
  ParentPlanStatus.CONTACTED,
  ParentPlanStatus.APPLIED,
]);

export async function upsertParentPlanItemAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("You must be logged in.");
  }

  const schoolId = String(formData.get("schoolId") ?? "");
  const statusRaw = String(formData.get("status") ?? ParentPlanStatus.SAVED);
  const notes = String(formData.get("notes") ?? "").trim();
  const remindAtRaw = String(formData.get("remindAt") ?? "").trim();

  if (!schoolId) {
    throw new Error("Missing school.");
  }

  const status = statusRaw as ParentPlanStatus;
  if (!validStatuses.has(status)) {
    throw new Error("Invalid status.");
  }

  await db.parentPlanItem.upsert({
    where: {
      userId_schoolId: {
        userId: session.user.id,
        schoolId,
      },
    },
    update: {
      status,
      notes: notes || null,
      remindAt: remindAtRaw ? new Date(remindAtRaw) : null,
    },
    create: {
      userId: session.user.id,
      schoolId,
      status,
      notes: notes || null,
      remindAt: remindAtRaw ? new Date(remindAtRaw) : null,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/schools/[slug]", "page");
}

export async function removeParentPlanItemAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("You must be logged in.");
  }

  const schoolId = String(formData.get("schoolId") ?? "");
  if (!schoolId) {
    throw new Error("Missing school.");
  }

  await db.parentPlanItem.deleteMany({
    where: {
      userId: session.user.id,
      schoolId,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/schools/[slug]", "page");
}

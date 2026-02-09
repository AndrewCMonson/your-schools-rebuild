"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function assignSchoolMembershipAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized.");
  }

  const userId = String(formData.get("userId") ?? "");
  const schoolId = String(formData.get("schoolId") ?? "");
  const role = String(formData.get("role") ?? "SCHOOL_EDITOR");

  if (!userId || !schoolId || !["SCHOOL_ADMIN", "SCHOOL_EDITOR"].includes(role)) {
    throw new Error("Invalid membership request.");
  }

  await db.schoolMembership.upsert({
    where: {
      userId_schoolId: {
        userId,
        schoolId,
      },
    },
    update: {
      role: role as "SCHOOL_ADMIN" | "SCHOOL_EDITOR",
      status: "ACTIVE",
    },
    create: {
      userId,
      schoolId,
      role: role as "SCHOOL_ADMIN" | "SCHOOL_EDITOR",
      status: "ACTIVE",
    },
  });

  await logAudit({
    actorId: session.user.id,
    action: "school_membership_assigned",
    entityType: "SchoolMembership",
    entityId: `${userId}:${schoolId}`,
    metadata: { role },
  });

  revalidatePath("/admin");
  revalidatePath("/portal");
}

export async function revokeSchoolMembershipAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized.");
  }

  const membershipId = String(formData.get("membershipId") ?? "");
  if (!membershipId) {
    throw new Error("Invalid membership id.");
  }

  const membership = await db.schoolMembership.update({
    where: { id: membershipId },
    data: { status: "SUSPENDED" },
  });

  await logAudit({
    actorId: session.user.id,
    action: "school_membership_suspended",
    entityType: "SchoolMembership",
    entityId: membership.id,
  });

  revalidatePath("/admin");
  revalidatePath("/portal");
}
